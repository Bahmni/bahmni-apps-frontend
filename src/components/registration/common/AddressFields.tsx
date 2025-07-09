import React from 'react';
import { Input } from './Input';
import { Address } from '@/types/registration';

interface AddressFieldsProps {
  address: Address;
  onChange: (address: Address) => void;
  errors?: any;
  touched?: any;
}

export const AddressFields: React.FC<AddressFieldsProps> = ({ address, onChange, errors = {}, touched = {} }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...address, [e.target.name]: e.target.value });
  };

  return (
    <div className="address-fields">
      <Input
        label="Address 1"
        name="address1"
        value={address.address1 || ''}
        onChange={handleChange}
        error={errors.address1}
        touched={touched.address1}
      />
      <Input
        label="Address 2"
        name="address2"
        value={address.address2 || ''}
        onChange={handleChange}
        error={errors.address2}
        touched={touched.address2}
      />
      <Input
        label="City/Village"
        name="cityVillage"
        value={address.cityVillage || ''}
        onChange={handleChange}
        error={errors.cityVillage}
        touched={touched.cityVillage}
      />
      <Input
        label="County/District"
        name="countyDistrict"
        value={address.countyDistrict || ''}
        onChange={handleChange}
        error={errors.countyDistrict}
        touched={touched.countyDistrict}
      />
      <Input
        label="State/Province"
        name="stateProvince"
        value={address.stateProvince || ''}
        onChange={handleChange}
        error={errors.stateProvince}
        touched={touched.stateProvince}
      />
      <Input
        label="Country"
        name="country"
        value={address.country || ''}
        onChange={handleChange}
        error={errors.country}
        touched={touched.country}
      />
      <Input
        label="Postal Code"
        name="postalCode"
        value={address.postalCode || ''}
        onChange={handleChange}
        error={errors.postalCode}
        touched={touched.postalCode}
      />
    </div>
  );
};
