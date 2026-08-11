# Note / Additional Instructions — Full Stack Analysis

---

## The Complete Data Chain (Confirmed from Source)

```
Frontend Write                  FHIR Resource              Backend Translator            DB (drug_orders table)      Print Template (FHIR API)
──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
instruction (Concept dropdown)  dosage.text = JSON          DosageTranslatorImpl          dosing_instructions         parseInstructions(text)
                                '{"instructions":"name"}'   setDosingInstructions         (text col, raw JSON)        → JSON.parse(text).instructions

"Note" (free text)              MedicationRequest.note      MedicationRequestTranslator   comment_to_fulfiller        ✗ NOT read by print
                                [{text: "..."}]             setCommentToFulfiller         (separate col)

[nothing written]               dosage.text JSON            DosageTranslatorImpl          dosing_instructions         parseAdditionalInstructions(text)
                                .additionalInstructions     reads from dosingInstructions (same col, same JSON)       → JSON.parse(text).additionalInstructions
                                (never set by new FE)                                                                 → printed as "Treatment Notes"
```

### Print Template — Exact Read Path (`compute.js:56`)
```js
treatmentNotes: parseAdditionalInstructions(mr.dosageInstruction?.[0]?.text)
// where:
function parseAdditionalInstructions(text) {
  return JSON.parse(text)?.additionalInstructions ?? '';
}
```

The print template calls the **FHIR API directly** (not the DB). It reads `dosageInstruction[0].text` — which the backend serves from `drug_orders.dosing_instructions`. It renders it as **"Treatment Notes"** in `template.html`.

`MedicationRequest.note` is **never read** by the print template.

### Print Template — Confirmed Field Usage
| Print field | Source in compute.js | Current state |
|---|---|---|
| Dosage instructions | `buildDosageInstructions(mr.dosageInstruction)` | ✅ Works |
| Instructions (coded) | `parseInstructions(dosage.text)` → JSON `.instructions` | ✅ Works |
| Treatment Notes | `parseAdditionalInstructions(dosage.text)` → JSON `.additionalInstructions` | ❌ Always empty — new Bahmni never writes this |
| Note / comment_to_fulfiller | (not read anywhere in compute.js) | ❌ Never printed |

---

## The drug_orders Table — Key Columns

| Column | Type | What's stored | FHIR field |
|---|---|---|---|
| `dosing_instructions` | TEXT | Raw JSON: `{"instructions":"...","additionalInstructions":"..."}` | `dosage.text` (1:1 via DosageTranslatorImpl) |
| `comment_to_fulfiller` | VARCHAR | Free text note to pharmacist | `MedicationRequest.note[0].text` |
| `dose` | DOUBLE | Numeric dose value | `dosage.doseAndRate[0].doseQuantity.value` |
| `dose_units` | INT (concept FK) | Dose unit concept | `dosage.doseAndRate[0].doseQuantity.code` |
| `frequency` | INT (concept FK) | Frequency concept | `dosage.timing.code.coding[0].code` |
| `route` | INT (concept FK) | Route concept | `dosage.route.coding[0].code` |
| `duration` | INT | Duration value | `dosage.timing.repeat.duration` |
| `duration_units` | INT (concept FK) | Duration unit | `dosage.timing.repeat.durationUnit` |
| `quantity` | DOUBLE | Dispense quantity | `dispenseRequest.quantity.value` |

**Key insight:** `dose`, `route`, `frequency`, `duration` etc. all have **dedicated DB columns** and are mapped individually by the FHIR translator. `dosing_instructions` is the only catch-all text column — currently used as a custom JSON blob for fields that don't have their own DB column.

---

## Why "Store Full FHIR Dosage Serialized" Doesn't Work

The idea of serializing the entire FHIR `Dosage` element into `dosing_instructions` creates a **double source of truth**:

- The backend translator already reads `dose`, `route`, `frequency`, `duration`, `timing` from their **dedicated DB columns** and builds the FHIR `Dosage` from those
- If `dosing_instructions` also contained a full Dosage JSON, there would be two competing sources for the same fields on read
- On write, you'd have to stop writing to dedicated columns (breaking pharmacy dispensing, reports, BI, old Bahmni UI) — or keep writing to both (duplication + drift risk)

This would require a complete overhaul of the OpenMRS data model. **Not viable.**

The realistic scope for `dosing_instructions` is: **only fields that have no dedicated DB column** — currently just `instructions` (concept name) and `additionalInstructions` (free text). These are what we should focus on.

---

## Backward Compatibility Strategy

For any change to what's written to `dosing_instructions` or `comment_to_fulfiller`:

### Read path (layered fallback)
```
1. Try new format first (e.g., dosage.patientInstruction, or new JSON key)
2. Fallback to old JSON format (dosage.text → JSON.parse → .additionalInstructions)
3. Fallback to MedicationRequest.note (comment_to_fulfiller)
```

### Write path
Write to the new field going forward. Old records stay in old format — the layered read path handles both. **No DB migration needed** since `dosing_instructions` is a free-text column.

### Print template
Add fallback read in `parseAdditionalInstructions` or at the call site in `compute.js`:
```js
treatmentNotes: parseAdditionalInstructions(mr.dosageInstruction?.[0]?.text)
             || mr.note?.[0]?.text  // fallback for new Bahmni medications
             || '';
```

---

## Options

### Option A: Fix print template only (1-liner, this card)
**Change:** `compute.js` — add fallback to `mr.note[0].text` after JSON parse.

```js
// compute.js line 56
treatmentNotes: parseAdditionalInstructions(mr.dosageInstruction?.[0]?.text)
             || mr.note?.[0]?.text
             || '',
```

- ✅ Fixes print for new Bahmni medications immediately
- ✅ Old medications still print via JSON path (backward compat)
- ✅ Zero DB, zero backend translator, zero frontend change
- ✅ FHIR mapping stays correct
- Scope: 1 line in `clinic-config` repo

---

### Option B: Frontend writes Note into `dosage.text` JSON as `additionalInstructions`
**Change:** Frontend puts the Note text into `dosage.text` JSON alongside `instructions`.

```ts
// medicationRequestResourceCreator.ts
dosage.text = JSON.stringify({
  instructions: medicationEntry.instruction?.name,
  additionalInstructions: medicationEntry.note,   // ← add this
});
// stop writing to MedicationRequest.note
```

- ✅ Print picks it up immediately (via existing JSON parse path)
- ✅ Old medications backward compat (same JSON shape)
- ❌ `dosage.text` remains JSON — FHIR spec violation
- ❌ `comment_to_fulfiller` unused — existing notes (saved by new Bahmni) lost on next edit unless parser has fallback
- ❌ Semantic mismatch — clinical note conflated into dosing instructions field
- Scope: resourceCreator + parser (with fallback) + tests

---

### Option C: Proper FHIR — `dosage.patientInstruction` + backend translator update (follow-up story)
**Change:**
- Rename UI field "Note" → "Additional Instructions"
- Frontend writes to `dosage.patientInstruction` (proper FHIR string field)
- Backend `DosageTranslatorImpl` maps `dosage.patientInstruction` ↔ `dosing_instructions` JSON `.additionalInstructions`
- Print template reads `mr.dosageInstruction[0].patientInstruction` directly (no JSON parsing needed)
- Old medications: print fallback reads JSON `.additionalInstructions`

- ✅ FHIR spec correct
- ✅ Print works
- ✅ Semantic clarity: `MedicationRequest.note` freed for actual clinical notes
- ❌ Multi-repo: frontend + backend DosageTranslator + print template
- ❌ Migration concern: existing new-Bahmni `comment_to_fulfiller` data needs read fallback
- Scope: 2–3 pointer story

---

## Recommendation

**This card:**
**Option A** — 1 line in `compute.js`. Fixes print. Zero risk. Everything else stays untouched.

**Follow-up:**
1. **Option C** — proper `dosage.patientInstruction` alignment across stack (multi-repo story)
2. **Instruction dropdown → `dosage.additionalInstruction`** CodeableConcept — separate 1-pointer (fixes fragile name-based concept lookup in edit flow)
3. Once Option C is done: clean `dosage.text` from JSON to proper human-readable string

---

## Suggested Fix (from this analysis)

**File:** `clinic-config/print-templates/prescriptions/compute.js`

**Change:** Line 56 — add fallback to `MedicationRequest.note` so new Bahmni medications appear in print.

```js
// Before
treatmentNotes: parseAdditionalInstructions(mr.dosageInstruction?.[0]?.text),

// After
treatmentNotes: parseAdditionalInstructions(mr.dosageInstruction?.[0]?.text)
             || mr.note?.[0]?.text
             || '',
```

**Why this works:**
- Old Bahmni medications → `dosage.text` JSON has `.additionalInstructions` → first expression resolves ✅
- New Bahmni medications → `dosage.text` JSON has no `.additionalInstructions` (empty string / falsy) → falls through to `mr.note[0].text` → `comment_to_fulfiller` from DB ✅
- If neither exists → empty string, no "Treatment Notes" row printed ✅

**What does NOT change:**
- No frontend code
- No backend translator code
- No DB schema or data migration
- No FHIR mapping changes
- `MedicationRequest.note` → `comment_to_fulfiller` mapping stays as-is

---

## DB Verification — Test Results (2026-06-23)

Patient: **Akhil** (`a1075e10-412b-42ae-a0fc-67677c69b092`)

| Field | Old Bahmni (order 188) | New Bahmni (order 187) |
|---|---|---|
| **Drug** | Paracetamol 500 mg | Albendazole 400 mg |
| **order_action** | NEW | NEW |
| **dosing_instructions** | `{"instructions":"As directed","additionalInstructions":"Old Bahmni (Additional)"}` | `{"instructions":"As directed"}` |
| **instructions** | As directed | As directed |
| **additionalInstructions_from_json** | `Old Bahmni (Additional)` | `NULL` |
| **comment_to_fulfiller** | `NULL` | `New Bahmni (Note)` |
| **treatmentNotes_as_print_would_show** | `Old Bahmni (Additional)` ✅ | `New Bahmni (Note)` ✅ |

### What this confirms

- **Old Bahmni** stores "Additional Instructions" in `dosing_instructions` JSON → `additionalInstructions_from_json` populated, `comment_to_fulfiller` is NULL
- **New Bahmni** stores "Note" in `comment_to_fulfiller` → `additionalInstructions_from_json` is NULL, `comment_to_fulfiller` populated
- **`treatmentNotes_as_print_would_show`** resolves correctly for **both** via the CASE fallback logic — validating that the proposed 1-line fix to `compute.js` will work
