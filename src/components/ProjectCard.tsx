import { useEffect, useState } from 'react'
import type { Project } from '../data'

const SLIDE_MS = 4000

interface Props {
  project: Project
  index: number
  total: number
  onReport: (project: Project) => void
}

/** One slide of the Work carousel. */
export default function ProjectCard({ project, index, total, onReport }: Props) {
  const [frame, setFrame] = useState(0)

  useEffect(() => {
    if (project.images.length < 2) return
    const id = window.setInterval(() => setFrame((i) => (i + 1) % project.images.length), SLIDE_MS)
    return () => window.clearInterval(id)
  }, [project.images.length])

  const pad = (n: number) => String(n).padStart(2, '0')

  return (
    <article
      className="slide"
      role="group"
      aria-roledescription="slide"
      aria-label={`${project.title}, ${index + 1} of ${total}`}
    >
      <div className="slide-media">
        <div className="project-image" style={{ backgroundImage: `url(${project.images[frame]})` }} />
      </div>

      <div className="slide-body">
        <p className="slide-index">
          {pad(index + 1)} / {pad(total)}
        </p>
        <h3>{project.title}</h3>
        <p className="slide-tags">{project.tags}</p>
        {project.summary && <p className="slide-text">{project.summary}</p>}
        {project.role && <p className="slide-meta">Role: {project.role}</p>}
        {project.stack && project.stack.length > 0 && <p className="slide-meta">{project.stack.join(' · ')}</p>}

        <div className="slide-actions">
          <button onClick={() => onReport(project)}>Diagnostic report</button>
          <a href={project.repo} target="_blank" rel="noopener noreferrer">
            Source
          </a>
          <a href={project.apk}>Download APK</a>
          {project.liveUrl && (
            <a href={project.liveUrl} target="_blank" rel="noopener noreferrer">
              Live demo
            </a>
          )}
        </div>
      </div>
    </article>
  )
}
