import { HorizontalScroller } from '../components/HorizontalScroller';
import { SectionLabel } from '../components/SectionLabel';
import { RevealText } from '../components/RevealText';
import { DomainDrawing } from './drawings/DomainDrawing';
import { projects, statusLabel, type Project } from '../content/projects';
import { copy } from '../content/copy';
import { useOnScreen } from '../lib/hooks';
import { asset } from '../lib/asset';

function ProjectPanel({ project, index, total }: { project: Project; index: number; total: number }) {
  const [ref, seen] = useOnScreen<HTMLElement>(0.3);
  const image = project.images[0];
  const rows = [
    { label: 'Category', value: project.category },
    { label: 'Location', value: project.location },
    { label: 'Status', value: statusLabel[project.status] },
    ...project.details,
  ];

  return (
    <article
      ref={ref}
      aria-labelledby={`project-${project.id}`}
      className="flex shrink-0 items-center px-[clamp(16px,4vw,56px)] py-10 max-lg:w-[88vw] max-lg:snap-center lg:h-full lg:w-[min(84vw,1240px)] lg:py-0"
    >
      <div className="grid w-full items-center gap-8 lg:grid-cols-12 lg:gap-12">
        <figure className="relative lg:col-span-7">
          <div className="drafting-grid relative aspect-[16/11] overflow-hidden border border-graphite/20 bg-[#e9e9e6] text-graphite">
            {image ? (
              <img src={asset(image.src)} alt={image.alt} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
            ) : (
              <DomainDrawing kind={project.placeholderDrawing} active={seen} className="absolute inset-0 h-full w-full p-[6%]" />
            )}
            {!project.verified && (
              <p className="label absolute top-[8%] right-[6%] -rotate-3 border border-graphite/40 bg-porcelain/85 px-3 py-2 text-graphite backdrop-blur-sm">
                Awaiting verified project information
              </p>
            )}
          </div>
          <figcaption className="label mt-3 flex justify-between text-ash">
            <span>
              {String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
            </span>
            <span>{image ? 'Project photograph' : 'Placeholder drawing'}</span>
          </figcaption>
        </figure>

        <div className="lg:col-span-5">
          <p className="label text-ash">{project.category}</p>
          <h3 id={`project-${project.id}`} className="metal-text-ink mt-4 font-display text-display-md font-medium">
            {project.title}
          </h3>
          <p className="mt-5 text-[16px] leading-relaxed text-industrial">{project.description}</p>
          <dl className="mt-8 border-t border-graphite/15">
            {rows.map((row) => (
              <div key={row.label} className="flex justify-between gap-6 border-b border-graphite/15 py-3.5 text-[14px]">
                <dt className="label pt-0.5 text-ash">{row.label}</dt>
                <dd className="text-right text-graphite">{row.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </article>
  );
}

/** 05 — Project portfolio, built to take verified projects as they are confirmed. */
export function Projects() {
  return (
    <div className="surface-light relative" data-surface="light">
      <HorizontalScroller id="projects" labelledBy="projects-title" mobile="snap" className="max-lg:pb-16">
        <header className="flex shrink-0 flex-col justify-center px-[clamp(16px,5vw,72px)] pt-28 pb-10 max-lg:w-[88vw] max-lg:snap-start lg:h-full lg:w-[min(40vw,620px)] lg:py-0">
          <SectionLabel number="05" label="Projects" tone="light" />
          <RevealText as="h2" className="metal-text-ink mt-8 font-display text-display-xl font-medium" id="projects-title">
            {copy.projects.heading}
          </RevealText>
          <p data-reveal className="mt-8 max-w-md text-[17px] leading-relaxed text-industrial">
            {copy.projects.body}
          </p>
        </header>
        {projects.map((project, i) => (
          <ProjectPanel key={project.id} project={project} index={i} total={projects.length} />
        ))}
        <div className="hidden w-[6vw] shrink-0 lg:block" aria-hidden="true" />
      </HorizontalScroller>
    </div>
  );
}
