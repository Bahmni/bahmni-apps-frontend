import {
  Icon,
  ICON_PADDING,
  ICON_SIZE,
} from '@bahmni-frontend/bahmni-design-system';
import React from 'react';

interface IconItemProps {
  iconName: string;
  displayName: string;
  id: string;
}

const IconItem: React.FC<IconItemProps> = ({ iconName, displayName, id }) => {
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
      <div style={{ marginBottom: '10px' }}>
        <Icon
          id={id}
          name={iconName}
          size={ICON_SIZE.X2}
          padding={ICON_PADDING.SMALL}
          ariaLabel={displayName}
          testId={`icon-test-${id}`}
        />
      </div>
      <span style={{ fontSize: '12px', textAlign: 'center' }}>
        {displayName}
      </span>
    </div>
  );
};

export const IconTest: React.FC = () => {
  const medicalIcons = [
    { iconName: 'fa-user', displayName: 'User' },
    { iconName: 'fa-hospital', displayName: 'Hospital' },
    { iconName: 'fa-pills', displayName: 'Pills' },
    { iconName: 'fa-stethoscope', displayName: 'Stethoscope' },
    { iconName: 'fa-heartbeat', displayName: 'Heartbeat' },
    { iconName: 'fa-user-md', displayName: 'Doctor' },
    { iconName: 'fa-file-medical', displayName: 'Medical File' },
    { iconName: 'fa-file-medical-alt', displayName: 'Medical Record' },
    { iconName: 'fa-ambulance', displayName: 'Ambulance' },
    { iconName: 'fa-procedures', displayName: 'Procedures' },
    { iconName: 'fa-notes-medical', displayName: 'Medical Notes' },
    { iconName: 'fa-lungs', displayName: 'Lungs' },
    { iconName: 'fa-thermometer-half', displayName: 'Temperature' },
    { iconName: 'fa-brain', displayName: 'Brain' },
    { iconName: 'fa-virus', displayName: 'Virus' },
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
      <h2>Bahmni Design System Icons Test</h2>
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
          <IconItem
            key={`icon-${index}`}
            iconName={item.iconName}
            displayName={item.displayName}
            id={`icon-${index}`}
          />
        ))}
      </div>
    </div>
  );
};
