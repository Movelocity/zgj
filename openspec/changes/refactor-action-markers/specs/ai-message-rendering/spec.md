# AI Message Rendering

## ADDED Requirements

### Requirement: Action Marker Parsing

The system SHALL parse four types of action markers from AI message content:
- `[[ACTION:ADD_PART|section|title|content]]` for adding new items to a resume section
- `[[ACTION:NEW_SECTION|section|null|content]]` for creating a new section
- `[[ACTION:EDIT|section|title|regex|replacement]]` for editing existing content with regex support
- `[[ACTION:DISPLAY|message]]` for displaying informational messages

#### Scenario: Parse ADD_PART marker

- **WHEN** AI message contains `[[ACTION:ADD_PART|工作经历|xx企业|负责xxx工作，在一个项目周期内提升系统效率xx%。主动提出xx。]]`
- **THEN** the system SHALL extract action type as "ADD_PART", section as "工作经历", title as "xx企业", and content as the full description

#### Scenario: Parse NEW_SECTION marker

- **WHEN** AI message contains `[[ACTION:NEW_SECTION|自我评价|null|擅长xxx,yyy,zzz]]`
- **THEN** the system SHALL extract action type as "NEW_SECTION", section as "自我评价", title as null, and content as "擅长xxx,yyy,zzz"

#### Scenario: Parse EDIT marker

- **WHEN** AI message contains `[[ACTION:EDIT|工作经历|xx企业|擅长沟通，.*能够协调工作。|善于洞察用户需求，具有较强的逻辑思维能力和沟通协调能力。]]`
- **THEN** the system SHALL extract action type as "EDIT", section as "工作经历", title as "xx企业", regex pattern as "擅长沟通，.*能够协调工作。", and replacement as the new text

#### Scenario: Parse DISPLAY marker

- **WHEN** AI message contains `[[ACTION:DISPLAY|我想修改下一段经历]]`
- **THEN** the system SHALL extract action type as "DISPLAY" and message as "我想修改下一段经历"

#### Scenario: Multiple markers in one message

- **WHEN** AI message contains multiple action markers
- **THEN** the system SHALL parse all markers in order and preserve their positions in the content

### Requirement: Action Marker Visual Rendering

The system SHALL render action markers in two distinct visual styles: full-width gray boxes for actionable markers (ADD_PART, NEW_SECTION, EDIT) and inline blue boxes for informational markers (DISPLAY).

#### Scenario: Render ADD_PART marker

- **WHEN** displaying an ADD_PART marker
- **THEN** the system SHALL show:
  - Full-width rounded gray border
  - Section and title information
  - Collapsible content preview
  - When collapsed: estimated character count
  - When expanded: full content text
  - Accept and Reject buttons

#### Scenario: Render NEW_SECTION marker

- **WHEN** displaying a NEW_SECTION marker
- **THEN** the system SHALL show:
  - Full-width rounded gray border
  - Section name
  - Collapsible content preview
  - When collapsed: estimated character count
  - When expanded: full content text
  - Accept and Reject buttons

#### Scenario: Render EDIT marker

- **WHEN** displaying an EDIT marker
- **THEN** the system SHALL show:
  - Full-width rounded gray border
  - Section and title information
  - Collapsible parameters display (regex and replacement)
  - When collapsed: estimated character count of changes
  - When expanded: full regex pattern and replacement text
  - Accept and Reject buttons

#### Scenario: Render DISPLAY marker

- **WHEN** displaying a DISPLAY marker
- **THEN** the system SHALL show:
  - Inline (non-full-width) blue border
  - Blue background with blue text
  - Message content
  - No action buttons

#### Scenario: Historical markers default state

- **WHEN** displaying action markers in historical messages
- **THEN** the system SHALL render markers in collapsed state by default
- **AND** Accept/Reject buttons SHALL NOT be shown

#### Scenario: Historical markers expand interaction

- **WHEN** user expands a historical action marker
- **THEN** the system SHALL show the full parameter details
- **AND** SHALL show a "Re-trigger" button to allow reapplying the action

### Requirement: Action Marker Interaction

The system SHALL allow users to accept or reject action markers, manage action queues, and trigger corresponding events.

#### Scenario: Expand/Collapse action marker

- **WHEN** user clicks expand button on a collapsed marker
- **THEN** the system SHALL show full parameter details
- **AND** change button to "收起"

#### Scenario: Accept ADD_PART action

- **WHEN** user clicks Accept on an ADD_PART marker
- **THEN** the system SHALL:
  - Dispatch `action-marker-accepted` event with marker details
  - Change marker state to "accepted"
  - Show "已应用" indicator
  - Hide Accept/Reject buttons

#### Scenario: Accept NEW_SECTION action

- **WHEN** user clicks Accept on a NEW_SECTION marker
- **THEN** the system SHALL:
  - Dispatch `action-marker-accepted` event with marker details
  - Change marker state to "accepted"
  - Show "已应用" indicator
  - Hide Accept/Reject buttons

#### Scenario: Accept EDIT action

- **WHEN** user clicks Accept on an EDIT marker
- **THEN** the system SHALL:
  - Dispatch `action-marker-accepted` event with marker details including regex and replacement
  - Change marker state to "accepted"
  - Show "已应用" indicator
  - Hide Accept/Reject buttons

#### Scenario: Reject any action

- **WHEN** user clicks Reject on any marker with action buttons
- **THEN** the system SHALL:
  - Dispatch `action-marker-rejected` event with marker details
  - Change marker state to "rejected"
  - Show "已忽略" indicator
  - Hide Accept/Reject buttons

#### Scenario: Multiple actions queue management

- **WHEN** a message contains multiple action markers
- **THEN** the system SHALL allow users to accept each action independently
- **AND** each action SHALL be processed and applied individually
- **AND** no ordering constraints SHALL be enforced

#### Scenario: Re-trigger historical action

- **WHEN** user expands a historical marker and clicks "重新触发"
- **THEN** the system SHALL dispatch `action-marker-accepted` event as if it were a new action
- **AND** apply the action to current resume data

#### Scenario: DISPLAY marker has no interaction

- **WHEN** user views a DISPLAY marker
- **THEN** the system SHALL NOT provide any Accept/Reject buttons
- **AND** SHALL NOT provide expand/collapse functionality
- **AND** no interaction events SHALL be triggered

### Requirement: Character Count Display

The system SHALL calculate and display estimated character count when action markers are in collapsed state.

#### Scenario: Calculate ADD_PART character count

- **WHEN** displaying a collapsed ADD_PART marker
- **THEN** the system SHALL count the length of content parameter
- **AND** display as "预计添加 N 字"

#### Scenario: Calculate NEW_SECTION character count

- **WHEN** displaying a collapsed NEW_SECTION marker
- **THEN** the system SHALL count the length of content parameter
- **AND** display as "预计添加 N 字"

#### Scenario: Calculate EDIT character count

- **WHEN** displaying a collapsed EDIT marker
- **THEN** the system SHALL count the length of replacement parameter
- **AND** display as "预计修改 N 字"

#### Scenario: DISPLAY has no character count

- **WHEN** displaying a DISPLAY marker
- **THEN** the system SHALL NOT show any character count

### Requirement: Event Data Structure

The system SHALL dispatch custom events with complete action marker information.

#### Scenario: action-marker-accepted event structure

- **WHEN** an action marker is accepted
- **THEN** the event detail SHALL include:
  - `markerId`: unique identifier for the marker
  - `type`: action type (ADD_PART, NEW_SECTION, EDIT)
  - `section`: target section name
  - `title`: target item title (or null for NEW_SECTION)
  - `content`: content for ADD_PART and NEW_SECTION
  - `regex`: pattern for EDIT
  - `replacement`: replacement text for EDIT
  - `messageId`: ID of the message containing the marker
  - `isRetrigger`: boolean indicating if this is a re-triggered historical action

#### Scenario: action-marker-rejected event structure

- **WHEN** an action marker is rejected
- **THEN** the event detail SHALL include:
  - `markerId`: unique identifier for the marker
  - `type`: action type
  - `messageId`: ID of the message containing the marker

## REMOVED Requirements

### Requirement: Button Rendering from [[text]] Format

**Reason**: The button-style interaction is being replaced with more intuitive diff-style action markers that provide clearer visual feedback and structured interactions.

**Migration**: AI systems should generate `[[ACTION:DISPLAY|text]]` instead of `[[text]]` for informational prompts.
