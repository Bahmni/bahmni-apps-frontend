import { ICON_SIZE } from '@/constants/icon';
import { Tag, Tile } from '@carbon/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from 'react';

const Test: React.FC = () => {
    return (
        <Tile style={{ width: '100%', paddingLeft: '2rem, 1rem', marginTop: '0.5rem', backgroundColor: 'white', borderRadius: '12px 12px 0px 0px' }}>
            {/* Header Row */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                <h5 style={{ margin: 0, marginRight: '1rem' }}>Thyroid function Test</h5>
                <span style={{ marginRight: '1rem' }}>Single Test</span>
                <Tag type="green">Routine</Tag>
            </div>

            {/* Info Row */}
            <div style={{ display: 'flex', alignItems: 'center' }}>
                <FontAwesomeIcon
                    icon={['fas', 'user-md']}
                    size={ICON_SIZE.XS}
                    style={{ marginLeft: '0.5rem', marginRight: '1rem' }}
                />
                <span style={{ marginRight: '1.5rem' }}>Ordered by: Dr. Sarah Johnson</span>
                <FontAwesomeIcon
                    icon={['fas', 'flask']}
                    size={ICON_SIZE.XS}
                    style={{ marginRight: '0.5rem' }}
                />          <span>Sample type: Blood</span>
            </div>
        </Tile>
      //  <LabTestResults/> - table ( results )
    );
};

export default Test;