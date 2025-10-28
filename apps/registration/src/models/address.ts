/**
 * Interface representing address field validation errors
 */
export interface AddressErrors {
  district: string;
  state: string;
  pincode: string;
}

/**
 * Interface tracking whether address fields were selected from dropdown
 * This is used to validate that hierarchical address fields (district, state, pincode)
 * are selected from the address hierarchy dropdown rather than manually entered
 */
export interface AddressSelectedFromDropdown {
  district: boolean;
  state: boolean;
  pincode: boolean;
}

/**
 * Initial values for address validation errors
 */
export const INITIAL_ADDRESS_ERRORS: AddressErrors = {
  district: '',
  state: '',
  pincode: '',
};

/**
 * Initial values for address dropdown selection tracking
 */
export const INITIAL_ADDRESS_SELECTED: AddressSelectedFromDropdown = {
  district: false,
  state: false,
  pincode: false,
};
