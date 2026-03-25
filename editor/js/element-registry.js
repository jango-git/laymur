/**
 * element-registry.js
 *
 * Declares every UIElement type the editor can create.
 * Each entry defines:
 *   - type        : UIElement class name (shown in dropdown)
 *   - fields      : ordered list of creation-time field descriptors
 *   - buildMessage: produces the postMessage payload sent to the preview iframe
 *
 * To add a new element type, append an entry here - no other file needs to change.
 *
 * Supported fieldTypes:
 *   "asset"   : <select> populated from state.assets
 *   "text"    : <input type="text">
 *   "number"  : <input type="number">
 */

/**
 * @typedef {'asset' | 'text' | 'number'} FieldType
 *
 * @typedef {Object} FieldDescriptor
 * @property {string}    key       - Unique key used to read back the value
 * @property {string}    label     - Display label in the add form
 * @property {FieldType} fieldType - Which input widget to render
 * @property {boolean}  [required] - Prevents Add when value is empty
 * @property {string}   [default]  - Initial value (for text/number)
 *
 * @typedef {Object} ElementDescriptor
 * @property {string}           type         - UIElement class name
 * @property {FieldDescriptor[]} fields       - Creation form fields
 * @property {(id: string, values: Record<string, string>, assets: import('./state.js').state['assets']) => object} buildMessage
 *   Builds the postMessage payload to send to the preview iframe.
 */

/** @type {ElementDescriptor[]} */
export const ELEMENT_REGISTRY = [
  {
    type: "UIImage",
    fields: [{ key: "assetId", label: "Texture", fieldType: "asset", required: true }],
    buildMessage(id, values, assets) {
      return {
        type: "ADD_IMAGE",
        id,
        dataURL: assets[values.assetId].dataURL,
      };
    },
  },
];

/** @type {Map<string, ElementDescriptor>} */
export const ELEMENT_REGISTRY_MAP = new Map(ELEMENT_REGISTRY.map((e) => [e.type, e]));
