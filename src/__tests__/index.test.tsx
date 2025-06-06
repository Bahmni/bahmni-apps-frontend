import React from 'react';
import { createRoot } from 'react-dom/client';
// Mock dependencies
jest.mock('react-dom/client', () => ({
  createRoot: jest.fn(() => ({
    render: jest.fn(),
  })),
}));

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  BrowserRouter: jest.fn(({ children, basename }) => (
    <div data-testid="browser-router" data-basename={basename}>
      {children}
    </div>
  )),
}));

jest.mock('../App', () => jest.fn(() => <div>App Component</div>));

// Mock styles import
jest.mock('../styles/index.scss', () => ({}));

// Mock i18n
jest.mock('../i18n', () => ({
  __esModule: true,
  default: {},
  i18nInstance: {},
}));

describe('Index', () => {
  let originalEnv: NodeJS.ProcessEnv;
  let mockRoot: HTMLElement;

  beforeAll(() => {
    // Save original console.error
    jest.spyOn(console, 'error').mockImplementation(() => {});
    // Save original process.env
    originalEnv = { ...process.env };
  });

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock document.getElementById
    mockRoot = document.createElement('div');
    mockRoot.id = 'root';
    document.body.appendChild(mockRoot);
  });

  afterEach(() => {
    // Clean up the DOM
    if (mockRoot && mockRoot.parentNode) {
      mockRoot.parentNode.removeChild(mockRoot);
    }

    // Reset process.env
    process.env = { ...originalEnv };
  });

  it('should render the app into the root element', () => {
    // Import index to trigger the rendering
    jest.isolateModules(() => {
      // eslint-disable-next-line
      require('../index');
    });

    // Verify that createRoot was called with the root element
    expect(createRoot).toHaveBeenCalledWith(mockRoot);

    // Verify that render was called on the root
    const mockCreateRoot = createRoot as jest.Mock;
    const mockRender = mockCreateRoot.mock.results[0].value.render;
    expect(mockRender).toHaveBeenCalled();
  });

  it('should throw an error when root element is not found', () => {
    // Remove the root element
    if (mockRoot && mockRoot.parentNode) {
      mockRoot.parentNode.removeChild(mockRoot);
    }

    // Mock getElementById to return null
    const originalGetElementById = document.getElementById;
    document.getElementById = jest.fn().mockReturnValue(null);

    // Expect an error when index is imported
    expect(() => {
      jest.isolateModules(() => {
        // eslint-disable-next-line
        require('../index');
      });
    }).toThrow('Failed to find the root element');

    // Restore getElementById
    document.getElementById = originalGetElementById;
  });
});
