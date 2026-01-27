export interface UIInputWrapperView {
  get dirty(): boolean;
  createInputCatcher(
    catchPointerDown: (x: number, y: number, identifier: number) => boolean,
    catchPointerMove: (x: number, y: number, identifier: number) => boolean,
    catchPointerUp: (x: number, y: number, identifier: number) => boolean,
    zIndex: number,
  ): number;
  destroyInputCatcher(handler: number): void;
  getZIndex(handler: number): number;
  setZIndex(handler: number, zIndex: number): void;
  getActive(handler: number): boolean;
  setActive(handler: number, active: boolean): void;
}

export interface UIInputWrapperCatcher {
  handler: number;
  catchPointerDown: (x: number, y: number, identifier: number) => boolean;
  catchPointerMove: (x: number, y: number, identifier: number) => boolean;
  catchPointerUp: (x: number, y: number, identifier: number) => boolean;
  zIndex: number;
  active: boolean;
}
