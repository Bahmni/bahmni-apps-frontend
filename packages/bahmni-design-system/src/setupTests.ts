import { initFontAwesome } from './fontawesome';

initFontAwesome();

global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

global.DOMRect = class DOMRect {
  x = 0;
  y = 0;
  width = 0;
  height = 0;
  top = 0;
  right = 0;
  bottom = 0;
  left = 0;
  toJSON() {
    return {};
  }
};
