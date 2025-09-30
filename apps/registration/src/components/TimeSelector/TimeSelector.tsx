import { Dropdown, Grid, Column } from '@bahmni-frontend/bahmni-design-system';
import React from 'react';

interface TimeSelectorProps {
  labelText?: string;
  value: string; // combined "hh:mm AM/PM"
  onChange: (time: string) => void;
}

const hours = Array.from({ length: 12 }, (_, i) =>
  (i + 1).toString().padStart(2, '0'),
);
const minutes = Array.from({ length: 60 }, (_, i) =>
  i.toString().padStart(2, '0'),
);
const suffixes: ('AM' | 'PM')[] = ['AM', 'PM'];

export const TimeSelector: React.FC<TimeSelectorProps> = ({
  labelText = 'Time',
  value,
  onChange,
}) => {
  const [hour = '', minute = '', suffix = ''] = value.split(/[: ]/);

  const updateTime = (h: string, m: string, s: string) => {
    const newTime = `${h}:${m} ${s}`;
    onChange(newTime);
  };

  return (
    <div>
      <label className="cds--label" htmlFor="time-hour">
        {labelText}
      </label>

      <Grid condensed>
        <Column lg={2} md={2} sm={2}>
          <Dropdown
            id="time-hour"
            size="sm"
            label="hh"
            items={hours}
            selectedItem={hour}
            onChange={({ selectedItem }) =>
              updateTime(selectedItem as string, minute, suffix)
            }
            titleText={undefined}
          />
        </Column>

        <Column lg={2} md={2} sm={2}>
          <Dropdown
            id="time-minute"
            size="sm"
            label="mm"
            items={minutes}
            selectedItem={minute}
            onChange={({ selectedItem }) =>
              updateTime(hour, selectedItem as string, suffix)
            }
            titleText={undefined}
          />
        </Column>

        <Column lg={2} md={2} sm={2}>
          <Dropdown
            id="time-suffix"
            size="sm"
            label="AM/PM"
            items={suffixes}
            selectedItem={suffix}
            onChange={({ selectedItem }) =>
              updateTime(hour, minute, selectedItem as 'AM' | 'PM')
            }
            titleText={undefined}
          />
        </Column>
      </Grid>
    </div>
  );
};
