import { render } from '@testing-library/react';

import BahmniFrontendRegistration from './registration';

describe('BahmniFrontendRegistration', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<BahmniFrontendRegistration />);
    expect(baseElement).toBeTruthy();
  });
});
