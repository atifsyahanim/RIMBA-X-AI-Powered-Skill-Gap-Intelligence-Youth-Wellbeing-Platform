"use client";

import type { ResumeVersion } from "@/types";

interface ResumePreviewProps {
  resume: ResumeVersion;
}

export function ResumePreview({ resume }: ResumePreviewProps) {
  const c = resume.content_json;

  return (
    <div
      id="resume-preview"
      className="bg-white rounded-xl border border-gray-200 p-8 text-gray-900 font-sans text-sm leading-relaxed max-w-2xl mx-auto shadow-sm"
    >
      {/* Header */}
      <div className="border-b-2 border-primary pb-4 mb-5">
        <h1 className="text-2xl font-bold text-gray-900">
          {resume.target_role ?? "My Resume"}
        </h1>
        <p className="text-xs text-gray-400 mt-0.5">{resume.version_name}</p>
      </div>

      {/* Summary */}
      {c.summary && (
        <section className="mb-5">
          <h2 className="text-xs font-bold text-primary uppercase tracking-widest mb-2">
            Professional Summary
          </h2>
          <p className="text-gray-700 text-sm leading-relaxed">{c.summary}</p>
        </section>
      )}

      {/* Skills */}
      {(c.skills?.technical?.length > 0 || c.skills?.soft?.length > 0) && (
        <section className="mb-5">
          <h2 className="text-xs font-bold text-primary uppercase tracking-widest mb-2">
            Skills
          </h2>
          {c.skills.technical?.length > 0 && (
            <div className="mb-1.5">
              <span className="text-[11px] font-semibold text-gray-500 uppercase mr-2">
                Technical:
              </span>
              <span className="text-sm text-gray-700">
                {c.skills.technical.join(" · ")}
              </span>
            </div>
          )}
          {c.skills.soft?.length > 0 && (
            <div>
              <span className="text-[11px] font-semibold text-gray-500 uppercase mr-2">
                Soft Skills:
              </span>
              <span className="text-sm text-gray-700">
                {c.skills.soft.join(" · ")}
              </span>
            </div>
          )}
        </section>
      )}

      {/* Experience */}
      {c.experience?.length > 0 && (
        <section className="mb-5">
          <h2 className="text-xs font-bold text-primary uppercase tracking-widest mb-2">
            Work Experience
          </h2>
          <div className="space-y-3">
            {c.experience.map((exp, i) => (
              <div key={i}>
                <div className="flex items-baseline justify-between">
                  <span className="font-semibold text-gray-900">
                    {exp.role}
                  </span>
                  <span className="text-xs text-gray-400">{exp.duration}</span>
                </div>
                <p className="text-xs text-primary font-medium mb-1">
                  {exp.company}
                </p>
                <ul className="space-y-0.5 pl-4">
                  {exp.bullets.map((b, j) => (
                    <li key={j} className="text-sm text-gray-700 list-disc">
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Education */}
      {c.education?.length > 0 && (
        <section className="mb-5">
          <h2 className="text-xs font-bold text-primary uppercase tracking-widest mb-2">
            Education
          </h2>
          <div className="space-y-2">
            {c.education.map((edu, i) => (
              <div key={i}>
                <div className="flex items-baseline justify-between">
                  <span className="font-semibold text-gray-900">
                    {edu.degree}
                  </span>
                  <span className="text-xs text-gray-400">{edu.year}</span>
                </div>
                <p className="text-xs text-gray-500">{edu.institution}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Certifications */}
      {c.certifications?.length > 0 && (
        <section className="mb-5">
          <h2 className="text-xs font-bold text-primary uppercase tracking-widest mb-2">
            Certifications
          </h2>
          <ul className="space-y-0.5 pl-4">
            {c.certifications.map((cert, i) => (
              <li key={i} className="text-sm text-gray-700 list-disc">
                {cert}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Projects */}
      {c.projects?.length > 0 && (
        <section>
          <h2 className="text-xs font-bold text-primary uppercase tracking-widest mb-2">
            Projects
          </h2>
          <div className="space-y-2">
            {c.projects.map((p, i) => (
              <div key={i}>
                <span className="font-semibold text-gray-900">{p.name}</span>
                {p.url && (
                  <a
                    href={p.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 text-[10px] text-primary hover:underline"
                  >
                    View →
                  </a>
                )}
                <p className="text-sm text-gray-600 mt-0.5">{p.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
