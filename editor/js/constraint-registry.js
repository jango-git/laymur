/**
 * constraint-registry.js
 *
 * Declares every constraint type the editor can create.
 * Each entry defines:
 *   - type               : internal key (used in postMessage and state)
 *   - label              : human-readable name for dropdown and card header
 *   - fields             : ordered list of add-form field descriptors
 *   - buildAddMessage    : produces ADD_CONSTRAINT postMessage payload
 *   - buildUpdateMessage : produces UPDATE_CONSTRAINT postMessage payload
 *   - cardDetail         : returns the subtitle string shown on the constraint card
 *
 * To add a new constraint type (including compound/procedural types), append an
 * entry here and add the corresponding handler to PREVIEW_CONSTRAINT_REGISTRY in
 * preview.html - no other file needs to change.
 *
 * Supported fieldTypes:
 *   "element" : <select> populated from state.elements (+ "Layer" option)
 *   "number"  : <input type="number"> (optionally with slider:true for 0-1 range)
 *
 * Paired fields:
 *   group      - string key; fields sharing the same group are rendered as one H:/V: row
 *   groupRole  - "h" | "v" - which cell of the paired row
 *   slider     - true : render as range slider + number input (for 0-1 anchors)
 */

/**
 * @typedef {'element' | 'number'} ConstraintFieldType
 *
 * @typedef {Object} ConstraintFieldDescriptor
 * @property {string}              key         - Key used to read/store the value
 * @property {string}              label       - Display label in the add form
 * @property {ConstraintFieldType} fieldType   - Which input widget to render
 * @property {boolean}            [required]   - Blocks Add when empty
 * @property {boolean}            [excludeSelf]- For element fields: exclude the value of
 *                                               the first element field from options
 * @property {boolean}            [noLayer]    - For element fields: omit the "Layer" option
 * @property {number}             [default]    - Initial value for number inputs
 * @property {number}             [min]
 * @property {number}             [max]
 * @property {number}             [step]
 * @property {string}             [group]      - Group key for paired H/V rendering
 * @property {'h'|'v'}            [groupRole]  - Role within paired row
 * @property {boolean}            [slider]     - Render as slider + number combo
 *
 * @typedef {Object} ConstraintDescriptor
 * @property {string}                   type
 * @property {string}                   label
 * @property {ConstraintFieldDescriptor[]} fields
 * @property {(id: string, values: Record<string, string|number>) => object} buildAddMessage
 * @property {(id: string, values: Record<string, string|number>) => object} buildUpdateMessage
 * @property {(c: object, elementLabel: (id: string) => string) => string} cardDetail
 */

/** @type {ConstraintDescriptor[]} */
export const CONSTRAINT_REGISTRY = [
  // ─── Compound / procedural types ────────────────────────────────────────────

  {
    type: "distance2d",
    label: "2D Distance",
    fields: [
      { key: "elementA", label: "Element A", fieldType: "element", required: true },
      {
        key: "elementB",
        label: "Element B",
        fieldType: "element",
        required: true,
        excludeSelf: true,
        noLayer: true,
      },
      {
        key: "hAnchorA",
        label: "Anchor A H (L→R)",
        fieldType: "number",
        default: 0.5,
        min: 0,
        max: 1,
        step: 0.05,
        group: "anchorA",
        groupRole: "h",
        slider: true,
      },
      {
        key: "vAnchorA",
        label: "Anchor A V (B→T)",
        fieldType: "number",
        default: 0.5,
        min: 0,
        max: 1,
        step: 0.05,
        group: "anchorA",
        groupRole: "v",
        slider: true,
      },
      {
        key: "hAnchorB",
        label: "Anchor B H (L→R)",
        fieldType: "number",
        default: 0.5,
        min: 0,
        max: 1,
        step: 0.05,
        group: "anchorB",
        groupRole: "h",
        slider: true,
      },
      {
        key: "vAnchorB",
        label: "Anchor B V (B→T)",
        fieldType: "number",
        default: 0.5,
        min: 0,
        max: 1,
        step: 0.05,
        group: "anchorB",
        groupRole: "v",
        slider: true,
      },
      {
        key: "hDistance",
        label: "H Distance",
        fieldType: "number",
        default: 0,
        step: 1,
        group: "distance",
        groupRole: "h",
      },
      {
        key: "vDistance",
        label: "V Distance",
        fieldType: "number",
        default: 0,
        step: 1,
        group: "distance",
        groupRole: "v",
      },
    ],
    buildAddMessage(id, values) {
      return { type: "ADD_CONSTRAINT", id, constraintType: "distance2d", fieldValues: values };
    },
    buildUpdateMessage(id, values) {
      return { type: "UPDATE_CONSTRAINT", id, constraintType: "distance2d", fieldValues: values };
    },
    cardDetail(c, elementLabel) {
      return `${elementLabel(c.fieldValues.elementA)} → ${elementLabel(c.fieldValues.elementB)}`;
    },
  },
  {
    type: "proportion2d",
    label: "2D Proportion",
    fields: [
      { key: "elementA", label: "Element A", fieldType: "element", required: true, noLayer: false },
      {
        key: "elementB",
        label: "Element B",
        fieldType: "element",
        required: true,
        excludeSelf: true,
        noLayer: true,
      },
      {
        key: "hProportion",
        label: "H Proportion",
        fieldType: "number",
        default: 1,
        step: 0.1,
        group: "proportion",
        groupRole: "h",
      },
      {
        key: "vProportion",
        label: "V Proportion",
        fieldType: "number",
        default: 1,
        step: 0.1,
        group: "proportion",
        groupRole: "v",
      },
    ],
    buildAddMessage(id, values) {
      return { type: "ADD_CONSTRAINT", id, constraintType: "proportion2d", fieldValues: values };
    },
    buildUpdateMessage(id, values) {
      return { type: "UPDATE_CONSTRAINT", id, constraintType: "proportion2d", fieldValues: values };
    },
    cardDetail(c, elementLabel) {
      return `${elementLabel(c.fieldValues.elementA)} → ${elementLabel(c.fieldValues.elementB)}`;
    },
  },
  {
    type: "size2d",
    label: "2D Size",
    fields: [
      { key: "elementA", label: "Element", fieldType: "element", required: true },
      { key: "width", label: "Width", fieldType: "number", default: 1, step: 0.1 },
      { key: "height", label: "Height", fieldType: "number", default: 1, step: 0.1 },
    ],
    buildAddMessage(id, values) {
      return { type: "ADD_CONSTRAINT", id, constraintType: "size2d", fieldValues: values };
    },
    buildUpdateMessage(id, values) {
      return { type: "UPDATE_CONSTRAINT", id, constraintType: "size2d", fieldValues: values };
    },
    cardDetail(c, elementLabel) {
      return elementLabel(c.fieldValues.elementA);
    },
  },

  // ─── Regular types ────────────────────────────────────────────

  {
    type: "aspect",
    label: "Aspect Ratio",
    fields: [
      {
        key: "elementA",
        label: "Element",
        fieldType: "element",
        required: true,
        noLayer: true,
      },
      { key: "value", label: "Aspect (w/h)", fieldType: "number", default: 1, step: 0.1 },
    ],
    buildAddMessage(id, values) {
      return { type: "ADD_CONSTRAINT", id, constraintType: "aspect", fieldValues: values };
    },
    buildUpdateMessage(id, values) {
      return { type: "UPDATE_CONSTRAINT", id, constraintType: "aspect", fieldValues: values };
    },
    cardDetail(c, elementLabel) {
      return elementLabel(c.fieldValues.elementA);
    },
  },
  {
    type: "horizontal",
    label: "Horizontal Distance",
    fields: [
      { key: "elementA", label: "Element A", fieldType: "element", required: true },
      {
        key: "elementB",
        label: "Element B",
        fieldType: "element",
        required: true,
        excludeSelf: true,
        noLayer: true,
      },
      { key: "distance", label: "Distance", fieldType: "number", default: 0, step: 1 },
      {
        key: "anchorA",
        label: "Anchor A (L→R)",
        fieldType: "number",
        default: 0.5,
        min: 0,
        max: 1,
        step: 0.05,
        slider: true,
      },
      {
        key: "anchorB",
        label: "Anchor B (L→R)",
        fieldType: "number",
        default: 0.5,
        min: 0,
        max: 1,
        step: 0.05,
        slider: true,
      },
    ],
    buildAddMessage(id, values) {
      return { type: "ADD_CONSTRAINT", id, constraintType: "horizontal", fieldValues: values };
    },
    buildUpdateMessage(id, values) {
      return { type: "UPDATE_CONSTRAINT", id, constraintType: "horizontal", fieldValues: values };
    },
    cardDetail(c, elementLabel) {
      return `${elementLabel(c.fieldValues.elementA)} → ${elementLabel(c.fieldValues.elementB)}`;
    },
  },
  {
    type: "vertical",
    label: "Vertical Distance",
    fields: [
      { key: "elementA", label: "Element A", fieldType: "element", required: true },
      {
        key: "elementB",
        label: "Element B",
        fieldType: "element",
        required: true,
        excludeSelf: true,
        noLayer: true,
      },
      { key: "distance", label: "Distance", fieldType: "number", default: 0, step: 1 },
      {
        key: "anchorA",
        label: "Anchor A (B→T)",
        fieldType: "number",
        default: 0.5,
        min: 0,
        max: 1,
        step: 0.05,
        slider: true,
      },
      {
        key: "anchorB",
        label: "Anchor B (B→T)",
        fieldType: "number",
        default: 0.5,
        min: 0,
        max: 1,
        step: 0.05,
        slider: true,
      },
    ],
    buildAddMessage(id, values) {
      return { type: "ADD_CONSTRAINT", id, constraintType: "vertical", fieldValues: values };
    },
    buildUpdateMessage(id, values) {
      return { type: "UPDATE_CONSTRAINT", id, constraintType: "vertical", fieldValues: values };
    },
    cardDetail(c, elementLabel) {
      return `${elementLabel(c.fieldValues.elementA)} → ${elementLabel(c.fieldValues.elementB)}`;
    },
  },
  {
    type: "width",
    label: "Fixed Width",
    fields: [
      { key: "elementA", label: "Element", fieldType: "element", required: true },
      { key: "value", label: "Width", fieldType: "number", default: 1, step: 0.1 },
    ],
    buildAddMessage(id, values) {
      return { type: "ADD_CONSTRAINT", id, constraintType: "width", fieldValues: values };
    },
    buildUpdateMessage(id, values) {
      return { type: "UPDATE_CONSTRAINT", id, constraintType: "width", fieldValues: values };
    },
    cardDetail(c, elementLabel) {
      return elementLabel(c.fieldValues.elementA);
    },
  },
  {
    type: "height",
    label: "Fixed Height",
    fields: [
      { key: "elementA", label: "Element", fieldType: "element", required: true },
      { key: "value", label: "Height", fieldType: "number", default: 1, step: 0.1 },
    ],
    buildAddMessage(id, values) {
      return { type: "ADD_CONSTRAINT", id, constraintType: "height", fieldValues: values };
    },
    buildUpdateMessage(id, values) {
      return { type: "UPDATE_CONSTRAINT", id, constraintType: "height", fieldValues: values };
    },
    cardDetail(c, elementLabel) {
      return elementLabel(c.fieldValues.elementA);
    },
  },
  {
    type: "horizontalProportion",
    label: "H-Proportion",
    fields: [
      { key: "elementA", label: "Element A", fieldType: "element", required: true, noLayer: false },
      {
        key: "elementB",
        label: "Element B",
        fieldType: "element",
        required: true,
        excludeSelf: true,
        noLayer: true,
      },
      { key: "value", label: "Proportion", fieldType: "number", default: 1, step: 0.1 },
    ],
    buildAddMessage(id, values) {
      return {
        type: "ADD_CONSTRAINT",
        id,
        constraintType: "horizontalProportion",
        fieldValues: values,
      };
    },
    buildUpdateMessage(id, values) {
      return {
        type: "UPDATE_CONSTRAINT",
        id,
        constraintType: "horizontalProportion",
        fieldValues: values,
      };
    },
    cardDetail(c, elementLabel) {
      return `${elementLabel(c.fieldValues.elementA)} → ${elementLabel(c.fieldValues.elementB)}`;
    },
  },
  {
    type: "verticalProportion",
    label: "V-Proportion",
    fields: [
      { key: "elementA", label: "Element A", fieldType: "element", required: true, noLayer: false },
      {
        key: "elementB",
        label: "Element B",
        fieldType: "element",
        required: true,
        excludeSelf: true,
        noLayer: true,
      },
      { key: "value", label: "Proportion", fieldType: "number", default: 1, step: 0.1 },
    ],
    buildAddMessage(id, values) {
      return {
        type: "ADD_CONSTRAINT",
        id,
        constraintType: "verticalProportion",
        fieldValues: values,
      };
    },
    buildUpdateMessage(id, values) {
      return {
        type: "UPDATE_CONSTRAINT",
        id,
        constraintType: "verticalProportion",
        fieldValues: values,
      };
    },
    cardDetail(c, elementLabel) {
      return `${elementLabel(c.fieldValues.elementA)} → ${elementLabel(c.fieldValues.elementB)}`;
    },
  },
];

/** @type {Map<string, ConstraintDescriptor>} */
export const CONSTRAINT_REGISTRY_MAP = new Map(CONSTRAINT_REGISTRY.map((e) => [e.type, e]));
