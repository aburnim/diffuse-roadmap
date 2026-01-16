export function HowToUse() {
  return (
    <div className="guide-container">
      <div className="guide-content">
        <h1 className="guide-title">How to Use This Site</h1>

        <p className="guide-intro">
          Welcome! This roadmap is a living document owned by the project manager to organize and communicate
          the DiffUSE project's progress. It provides a visual overview of what's happening across all working groups.
        </p>

        <section className="guide-section">
          <h2>The Board View</h2>
          <p>
            The main board is organized into <strong>swimlanes</strong> (horizontal rows for each working group)
            and <strong>stages</strong> (columns showing timeline):
          </p>
          <ul>
            <li><strong>Recent</strong> - Work happening now or just completed</li>
            <li><strong>Short-term</strong> - Coming up in the next few weeks/months</li>
            <li><strong>Long-term</strong> - Future plans and goals</li>
          </ul>
        </section>

        <section className="guide-section">
          <h2>Item Types</h2>
          <p>Cards on the board represent different types of work:</p>

          <div className="guide-item-types">
            <div className="guide-item-type">
              <div className="guide-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <path d="M9 12h6m-3-3v6" />
                </svg>
              </div>
              <div>
                <strong>Milestone</strong>
                <p>A significant achievement or deliverable. These are concrete accomplishments.</p>
              </div>
            </div>

            <div className="guide-item-type">
              <div className="guide-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <strong>Goal</strong>
                <p>An objective we're working toward. Goals can have check-ins and sub-tasks to track progress.</p>
              </div>
            </div>

            <div className="guide-item-type">
              <div className="guide-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6l4 2" />
                </svg>
              </div>
              <div>
                <strong>Output</strong>
                <p>A tangible result like a publication, presentation, dataset, or other deliverable.</p>
              </div>
            </div>

            <div className="guide-item-type">
              <div className="guide-icon guide-icon-blocker">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <strong>Blocker</strong>
                <p>An obstacle or risk that needs attention. Blockers can be open, mitigated, or resolved.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="guide-section">
          <h2>Wins</h2>
          <p>
            Items marked as <strong>wins</strong> are highlighted with a golden star icon. These represent
            particularly noteworthy achievements worth celebrating!
          </p>
        </section>

        <section className="guide-section">
          <h2>Dependencies</h2>
          <p>
            Items can be linked to show what <strong>depends on</strong> what. When you hover over a card,
            related cards are highlighted. Click a card to see its full dependency chain in the detail panel.
          </p>
          <p>
            Use the "Show Dependencies" toggle in the filter bar to display connecting lines between dependent items.
          </p>
        </section>

        <section className="guide-section">
          <h2>Sub-items</h2>
          <p>
            Milestones and goals can contain <strong>sub-items</strong> - smaller tasks that contribute to the
            larger item. Click any card to open its detail panel and see sub-items in three views:
          </p>
          <ul>
            <li><strong>Tasks</strong> - Simple checklist view</li>
            <li><strong>Kanban</strong> - Board with status columns</li>
            <li><strong>Roadmap</strong> - Mini timeline view</li>
          </ul>
        </section>

        <section className="guide-section">
          <h2>Recent Updates</h2>
          <p>
            The <strong>Recent Updates</strong> tab shows a timeline of the latest changes across all items.
            Each entry shows:
          </p>
          <ul>
            <li>The working group (colored badge)</li>
            <li>What changed (created, completed, status changed, etc.)</li>
            <li>When it happened (relative time)</li>
          </ul>
          <p>Click any item in the timeline to see its full details.</p>
        </section>

        <section className="guide-section">
          <h2>Editing</h2>
          <p>
            Toggle <strong>Edit mode</strong> (top right) to make changes. In edit mode you can:
          </p>
          <ul>
            <li>Add new items and swimlanes</li>
            <li>Drag items between stages</li>
            <li>Edit titles, descriptions, and metadata</li>
            <li>Mark items as complete or highlight them as wins</li>
            <li>Manage dependencies and links</li>
          </ul>
        </section>

        <section className="guide-section">
          <h2>Import & Export</h2>
          <p>
            Use the download and upload buttons in the header to export the roadmap as JSON or import
            a previously saved version. The "Share" button copies a read-only link to your clipboard.
          </p>
        </section>

        <div className="guide-callout">
          <p>For comments, questions, concerns, corrections, or submissions — <strong>Slack Andy!</strong></p>
        </div>
      </div>
    </div>
  );
}
