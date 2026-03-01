export interface UserAction {
  id: string;
  label: string;
  onClick: () => void | Promise<void>;
  priority?: number;
  requiredPrivilege?: string;
  disabled?: boolean;
}
