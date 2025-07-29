import {
  faUser,
  faHospital,
  faPills,
  faStethoscope,
  faHeartbeat,
  faUserMd,
  faFileMedical,
  faFileMedicalAlt,
  faAmbulance,
  faProcedures,
  faNotesMedical,
  faLungs,
  faTemperatureHigh,
  faBrain,
  faVirus,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from 'react';

interface IconItemProps {
  icon: any;
  name: string;
}

const IconItem: React.FC<IconItemProps> = ({ icon, name }) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        margin: '10px',
        padding: '15px',
        border: '1px solid #eee',
        borderRadius: '8px',
        width: '120px',
        height: '120px',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        backgroundColor: 'white',
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.backgroundColor = '#f5f5f5';
        e.currentTarget.style.transform = 'scale(1.05)';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.backgroundColor = 'white';
        e.currentTarget.style.transform = 'scale(1)';
      }}
    >
      <FontAwesomeIcon icon={icon} size="2x" style={{ marginBottom: '10px' }} />
      <span style={{ fontSize: '12px', textAlign: 'center' }}>{name}</span>
    </div>
  );
};

export const IconTest: React.FC = () => {
  const medicalIcons = [
    { icon: faUser, name: 'User' },
    { icon: faHospital, name: 'Hospital' },
    { icon: faPills, name: 'Pills' },
    { icon: faStethoscope, name: 'Stethoscope' },
    { icon: faHeartbeat, name: 'Heartbeat' },
    { icon: faUserMd, name: 'Doctor' },
    { icon: faFileMedical, name: 'Medical File' },
    { icon: faFileMedicalAlt, name: 'Medical Record' },
    { icon: faAmbulance, name: 'Ambulance' },
    { icon: faProcedures, name: 'Procedures' },
    { icon: faNotesMedical, name: 'Medical Notes' },
    { icon: faLungs, name: 'Lungs' },
    { icon: faTemperatureHigh, name: 'Temperature' },
    { icon: faBrain, name: 'Brain' },
    { icon: faVirus, name: 'Virus' },
  ];

  return (
    <div
      style={{
        border: '1px solid #ccc',
        padding: '20px',
        margin: '10px',
        borderRadius: '8px',
      }}
    >
      <h2>FontAwesome Icons Test</h2>
      <p>Hover over icons to see animation effect</p>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          marginTop: '20px',
        }}
      >
        {medicalIcons.map((item, index) => (
          <IconItem key={index} icon={item.icon} name={item.name} />
        ))}
      </div>
    </div>
  );
};
