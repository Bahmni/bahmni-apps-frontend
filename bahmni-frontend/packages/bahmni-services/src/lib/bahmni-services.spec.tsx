import { render } from '@testing-library/react';

import BahmniServices from './bahmni-services';

describe('BahmniServices', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<BahmniServices />);
    expect(baseElement).toBeTruthy();
  });
});
