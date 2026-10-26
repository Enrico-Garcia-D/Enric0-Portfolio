import type { Project } from '../data'
import Modal from './Modal'

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="report-row">
      <span className="report-key">{label}</span>
      <span>{children}</span>
    </div>
  )
}

export default function ReportModal({ project, onClose }: { project: Project; onClose: () => void }) {
  return (
    <Modal title={`Diagnostic report: ${project.title}`} onClose={onClose}>
      <div className="modal-body">
        <p className="report-head">[ Overview ]</p>
        <Row label="Project">{project.title}</Row>
        <Row label="Category">{project.tags}</Row>
        {project.summary && <Row label="Summary">{project.summary}</Row>}
        {project.role && <Row label="My role">{project.role}</Row>}

        <p className="report-head">[ Software ]</p>
        <Row label="Platform">{project.platform}</Row>
        {project.stack && project.stack.length > 0 && <Row label="Stack">{project.stack.join(', ')}</Row>}

        <p className="report-head">[ Hardware ]</p>
        <Row label="Uses">{project.hardware?.length ? project.hardware.join(', ') : 'No special hardware required'}</Row>

        <p className="report-head">[ Links ]</p>
        <Row label="Source">
          <a href={project.repo} target="_blank" rel="noopener noreferrer">
            GitHub repository
          </a>
        </Row>
        <Row label="Build">
          <a href={project.apk}>Download APK</a>
        </Row>
        {project.liveUrl && (
          <Row label="Live">
            <a href={project.liveUrl} target="_blank" rel="noopener noreferrer">
              Open demo
            </a>
          </Row>
        )}
      </div>
    </Modal>
  )
}
