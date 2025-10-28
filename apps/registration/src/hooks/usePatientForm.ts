import { useState, useCallback } from 'react';
import { INITIAL_FORM_DATA, type PatientFormData } from '../models/patientForm';

export const usePatientForm = () => {
  const [formData, setFormData] = useState<PatientFormData>(INITIAL_FORM_DATA);

  const handleInputChange = useCallback(
    (field: keyof PatientFormData, value: string | number | boolean) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const updateMultipleFields = useCallback(
    (updates: Partial<PatientFormData>) => {
      setFormData((prev) => ({ ...prev, ...updates }));
    },
    [],
  );

  const resetForm = useCallback(() => {
    setFormData(INITIAL_FORM_DATA);
  }, []);

  return {
    formData,
    handleInputChange,
    updateMultipleFields,
    resetForm,
    setFormData,
  };
};
