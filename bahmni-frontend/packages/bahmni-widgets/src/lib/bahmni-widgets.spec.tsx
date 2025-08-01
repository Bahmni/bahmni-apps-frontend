import { render } from '@testing-library/react';

import BahmniFrontendBahmniWidgets from './bahmni-widgets';

describe('BahmniFrontendBahmniWidgets', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<BahmniFrontendBahmniWidgets />);
    expect(baseElement).toBeTruthy();
  });
});
