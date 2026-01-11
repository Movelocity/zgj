# Design: Action Marker System

## Context

The current system uses `[[text]]` format to render clickable buttons in AI messages, but this interaction pattern is not intuitive. Users may not understand that these are interactive elements, and the action they trigger is ambiguous. We need a more explicit and visually clear way to present AI-suggested actions on resume content.

This change introduces a structured action marker system inspired by Git diff visual patterns, where each suggested change is clearly labeled with its type, target, and content, and users can explicitly accept or reject each suggestion.

## Goals / Non-Goals

### Goals
- Replace button-based interaction with structured action markers
- Provide clear visual distinction between different action types (add, edit, new section, display)
- Enable users to accept or reject each action independently
- Support regex-based text replacement for precise editing
- Maintain compatibility with existing `resume-update` code block system
- Ensure historical messages display markers in read-only mode

### Non-Goals
- Implementing backend changes (this is frontend-only)
- Supporting nested or conditional actions
- Providing batch accept/reject functionality (may be added later)
- Modifying the AI prompt engineering to generate these markers (separate concern)

## Decisions

### Decision 1: Four Action Types

**Choice**: Use four distinct action types (ADD_PART, NEW_SECTION, EDIT, DISPLAY) rather than a generic action system.

**Rationale**: 
- These four types cover the most common resume editing operations
- Each type has distinct visual requirements and interaction patterns
- Type-specific handling allows for better UX (e.g., DISPLAY has no buttons)
- Clear separation prevents confusion between informational and actionable markers

**Alternatives considered**:
- Generic action system with configurable types → Too complex for current needs
- More action types (DELETE, MOVE, etc.) → Can be added incrementally if needed
- Unified style for all types → Would reduce visual clarity

### Decision 2: Pipe-Separated Parameter Format

**Choice**: Use `[[ACTION:TYPE|param1|param2|param3|param4]]` format with pipe separators.

**Rationale**:
- Pipe character is rarely used in natural language text, reducing false positives
- Easy to parse with split and regex
- Human-readable format for debugging
- Maintains consistency with existing `[[text]]` bracket convention

**Alternatives considered**:
- JSON format `[[ACTION:{"type":"ADD","section":"..."}]]` → Too verbose, harder for AI to generate consistently
- Comma-separated → Conflicts with natural language content
- XML-style tags → Too verbose and harder to parse

### Decision 3: Regex Support for EDIT Action

**Choice**: Use JavaScript regex in the third parameter of EDIT actions.

**Rationale**:
- Enables precise text matching (e.g., matching partial sentences)
- Supports flexible patterns like `.*` for wildcard matching
- Commonly understood pattern format
- Already available in JavaScript runtime

**Alternatives considered**:
- Exact string matching only → Too restrictive for real-world editing
- Custom pattern syntax → Unnecessary complexity, regex is well-known
- Multiple match strategies → Confusing for users and AI

### Decision 4: Event-Based Communication

**Choice**: Use custom DOM events (`action-marker-accepted`, `action-marker-rejected`) for communication between components.

**Rationale**:
- Consistent with existing `resume-update-detected` and `resume-update-formatted` events
- Decouples AiMessageRenderer from ChatPanel
- Allows multiple listeners if needed
- Easy to debug with browser DevTools

**Alternatives considered**:
- Props callbacks → Requires passing callbacks through component tree
- Context API → Overkill for this simple communication
- Direct function calls → Tight coupling, harder to test

### Decision 6: Historical Messages are Read-Only

**Choice**: Disable action buttons for markers in historical messages (`isHistorical` flag).

**Rationale**:
- Actions only make sense in the context of the current conversation
- Prevents confusion from outdated suggestions
- Reduces complexity in state management
- Consistent with how `resume-update` blocks are handled

**Alternatives considered**:
- Allow actions on historical messages → Could lead to inconsistent state
- Hide markers entirely → Users might want to see what was suggested
- Archive markers differently → Additional complexity

## Technical Implementation Details

### Parsing Strategy

The action markers will be parsed in the same `useEffect` that handles `resume-update` blocks:

1. Split content by lines
2. Use regex to match `[[ACTION:TYPE|params]]` patterns
3. Extract parameters by splitting on unescaped pipes
4. Generate stable marker IDs using hash function (like block IDs)
5. Replace markers with placeholder tokens (like `__ACTION_MARKER_0__`)
6. Store parsed markers in state

### Component Structure

```
AiMessageRenderer
├─ processedContent (string with placeholders)
├─ actionMarkers (ActionMarker[])
└─ renderContent()
   ├─ Split by placeholders
   ├─ Map text → MarkdownRenderer
   └─ Map placeholders → ActionMarkerDisplay
```

### State Management

- Use React state for `actionMarkers: ActionMarker[]`
- Use `useRef` for tracking processed markers (deduplication)
- Each marker has `{ id, type, section, title, content?, regex?, replacement?, status }`
- Status: `pending | accepted | rejected`

### Styling Approach

Use Tailwind classes for consistency:
- ADD_PART: `border-l-4 border-green-500 bg-green-50`
- NEW_SECTION: `border-l-4 border-blue-500 bg-blue-50`
- EDIT: `border-l-4 border-yellow-500 bg-yellow-50`
- DISPLAY: `border-l-4 border-gray-400 bg-gray-50`

Icons from `react-icons`:
- `FiPlus` for ADD_PART
- `FiEdit` for EDIT
- `FiStar` for NEW_SECTION
- `FiInfo` for DISPLAY

## Risks / Trade-offs

### Risk: Regex Complexity
**Description**: Users or AI might create invalid regex patterns causing parsing errors.
**Mitigation**: 
- Wrap regex matching in try-catch
- Log errors clearly
- Fallback to exact string match if regex fails
- Document regex limitations for AI prompt engineers

### Risk: Parameter Escaping
**Description**: Pipe characters in content could break parameter parsing.
**Mitigation**:
- Use greedy matching for the last parameter (content/replacement)
- Document that content should not contain literal `|` characters
- Consider supporting escaped pipes (`\|`) if needed

### Risk: Visual Clutter
**Description**: Multiple markers in one message could overwhelm the UI.
**Mitigation**:
- Use compact single-line design
- Consider collapse/expand if more than 5 markers
- Add smooth animations for accept/reject to reduce jarring changes

### Trade-off: Breaking Change
**Description**: Removing `[[text]]` button support breaks existing functionality.
**Impact**: AI systems generating old format will lose button rendering.
**Justification**: The new system is strictly better; migration path is simple (use DISPLAY action).

## Migration Plan

### For Frontend
1. Deploy new `AiMessageRenderer` with action marker support
2. Deploy updated `ChatPanel` event handlers
3. Remove button rendering from `Markdown.tsx`
4. Test with sample messages containing new action formats

### For AI/Backend
1. Update AI prompts to generate new action marker format
2. Replace `[[text]]` generation with `[[ACTION:DISPLAY|text]]`
3. Add examples of all four action types to AI system prompts
4. Test with live conversations to ensure proper formatting

### Rollback Strategy
If issues arise:
1. Revert frontend changes
2. Old `[[text]]` button system can be restored from git history
3. No database changes required

## Open Questions

1. **Should we support batch operations?** (e.g., "Accept All")
   - Decision: Not in initial version; can add later based on user feedback

2. **How should we handle conflicting actions?** (e.g., two EDITs targeting the same text)
   - Decision: Process in order; later actions may fail if target is already changed

3. **Should actions be undoable?**
   - Decision: Not in this phase; rely on resume versioning system for undo

4. **What happens if regex matches multiple places?**
   - Decision: Replace first match only; AI should generate more specific patterns

5. **Should DISPLAY markers be dismissible?**
   - Decision: No; they're informational and part of the message history
