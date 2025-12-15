# Panoramic Course Editor Implementation Plan

## Goal
Implement a Kanban-style "Panoramic View" for course editing, where teachers can visualize and manage the 5 stages of a lesson (Intro, Knowledge, Experience, Experiment, Assignment) side-by-side.

## User Review Required
> [!IMPORTANT]
> This new view replaces the traditional form-based `CourseDetailView`.
> We assume the 5 stages are fixed in order, but content *within* stages is editable.

## Proposed Changes

### Store Layer
#### [MODIFY] [course.ts](file:///home/wht/reopeninnolab/apps/web-teacher/src/stores/course.ts)
- Add actions to support resource management:
    - `addResourceToModule(moduleType: string, resource: Any)`
    - `removeResourceFromModule(moduleType: string, resourceId: string)`
    - `reorderResourcesInModule(moduleType: string, newOrder: [])`

### View Layer
#### [NEW] [PanoramicCourseView.vue](file:///home/wht/reopeninnolab/apps/web-teacher/src/views/Courses/PanoramicCourseView.vue)
-   **Layout**: `TeacherWorkspaceLayout`
-   **Main Area**: Horizontal scrolling container (`.panoramic-lane-container`).
-   **Components**:
    -   `StageColumn.vue`: Vertical list for a specific stage.
    -   `StageCard.vue`: Represents a resource or activity.
    -   `ResourceDrawer.vue`: A sidebar drawer to drag-and-drop assets from.

## Verification Plan

### Manual Verification
1.  **Navigation**: Go to Course Management -> Click a Course. Ensure it opens `/courses/:id/panoramic`.
2.  **Display**: Verify 5 columns are shown (Intro -> Assignment).
3.  **Interaction**:
    -   Click "Add Resource" on a column.
    -   Drawer opens.
    -   Drag a resource to the column.
    -   Verify resource appears in the column.
4.  **Persistence**: Refresh page, ensure resources persist (via Store/Mock API).
