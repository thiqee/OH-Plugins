import { useEffect, useMemo, useState } from 'react';
import { hana } from '@hana/plugin-sdk';
import { Button, HanaThemeProvider, Select, TextInput } from '@hana/plugin-components';
import { api, Diagnostics, Preview, Project, Task } from './api';
import { createTranslator, detectLocale, htmlLangForLocale } from './i18n';
import type { Translate, TranslationKey } from './i18n';

const timelineClips = [
  { id: 'intro', labelKey: 'clipIntro', start: 0, duration: 4, track: 0 },
  { id: 'outro', labelKey: 'clipOutro', start: 4, duration: 4, track: 0 },
  { id: 'caption-a', labelKey: 'clipCaption', start: 0.7, duration: 2.8, track: 1 },
  { id: 'caption-b', labelKey: 'clipPrompt', start: 4.6, duration: 2.7, track: 1 },
] satisfies Array<{
  id: string;
  labelKey: TranslationKey;
  start: number;
  duration: number;
  track: number;
}>;

const taskTypeKeys: Record<string, TranslationKey> = {
  lint: 'taskTypeLint',
  render: 'taskTypeRender',
  task: 'taskTypeTask',
};

const taskStatusKeys: Record<string, TranslationKey> = {
  running: 'taskStatusRunning',
  completed: 'taskStatusCompleted',
  failed: 'taskStatusFailed',
};

const renderQualityOptions = [
  { value: 'draft', labelKey: 'qualityDraft' },
  { value: 'standard', labelKey: 'qualityStandard' },
  { value: 'high', labelKey: 'qualityHigh' },
] satisfies Array<{
  value: string;
  labelKey: TranslationKey;
}>;

const formatOptions = [
  { value: 'mp4', label: 'MP4' },
  { value: 'webm', label: 'WebM' },
];

export function App() {
  const locale = useMemo(() => detectLocale(), []);
  const t = useMemo(() => createTranslator(locale), [locale]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [diagnostics, setDiagnostics] = useState<Diagnostics | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [title, setTitle] = useState(() => t('defaultProjectTitle'));
  const [format, setFormat] = useState('mp4');
  const [quality, setQuality] = useState('standard');
  const [fps, setFps] = useState('30');
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selected = useMemo(
    () => projects.find((project) => project.id === selectedId) || projects[0] || null,
    [projects, selectedId],
  );

  useEffect(() => {
    document.documentElement.lang = htmlLangForLocale(locale);
    document.title = t('documentTitle');
    refresh();
  }, [locale, t]);

  async function refresh() {
    setError(null);
    try {
      const [projectResult, diagnosticResult, taskResult] = await Promise.all([
        api.listProjects(),
        api.diagnostics(),
        api.listTasks(),
      ]);
      setProjects(projectResult.projects);
      setDiagnostics(diagnosticResult);
      setTasks(taskResult.tasks);
      if (!selectedId && projectResult.projects[0]) setSelectedId(projectResult.projects[0].id);
    } catch (err) {
      setError(messageOf(err));
    }
  }

  async function createProject() {
    setBusy('create');
    setError(null);
    try {
      const result = await api.createProject(title);
      setProjects((items) => [result.project, ...items]);
      setSelectedId(result.project.id);
      await hana.toast.show({ message: t('toastProjectCreated'), type: 'success' });
    } catch (err) {
      setError(messageOf(err));
    } finally {
      setBusy(null);
    }
  }

  async function startPreview() {
    if (!selected) return;
    setBusy('preview');
    setError(null);
    try {
      const result = await api.startPreview(selected.id);
      setPreview(result.preview);
    } catch (err) {
      setError(messageOf(err));
    } finally {
      setBusy(null);
    }
  }

  async function lint() {
    if (!selected) return;
    setBusy('lint');
    setError(null);
    try {
      await api.lintProject(selected.id);
      await refresh();
      await hana.toast.show({ message: t('toastLintComplete'), type: 'success' });
    } catch (err) {
      setError(messageOf(err));
      await refresh();
    } finally {
      setBusy(null);
    }
  }

  async function render() {
    if (!selected) return;
    setBusy('render');
    setError(null);
    try {
      await api.renderProject(selected.id, { format, fps: Number(fps), quality });
      await refresh();
      await hana.toast.show({ message: t('toastRenderComplete'), type: 'success' });
    } catch (err) {
      setError(messageOf(err));
      await refresh();
    } finally {
      setBusy(null);
    }
  }

  return (
    <HanaThemeProvider mode="inherit">
      <main className="hf-shell">
        <aside className="hf-rail">
          <div className="hf-brand">
            <span className="hf-kicker">HyperFrames</span>
            <h1>{t('appTitle')}</h1>
          </div>

          <div className="hf-create">
            <TextInput label={t('projectLabel')} value={title} onChange={(event) => setTitle(event.currentTarget.value)} />
            <Button variant="primary" onClick={createProject} loading={busy === 'create'}>{t('create')}</Button>
          </div>

          <div className="hf-project-list">
            {projects.map((project) => (
              <button
                key={project.id}
                className={`hf-project ${project.id === selected?.id ? 'is-active' : ''}`}
                onClick={() => setSelectedId(project.id)}
              >
                <span>{project.title}</span>
                <small>{t('projectRenders', { count: project.outputs.length })}</small>
              </button>
            ))}
            {!projects.length && <p className="hf-muted">{t('noProjects')}</p>}
          </div>
        </aside>

        <section className="hf-workspace">
          <header className="hf-toolbar">
            <div>
              <span className="hf-kicker">{t('studio')}</span>
              <h2>{selected?.title || t('noProjectSelected')}</h2>
            </div>
            <div className="hf-actions">
              <Button variant="secondary" onClick={refresh}>{t('refresh')}</Button>
              <Button variant="secondary" onClick={startPreview} disabled={!selected} loading={busy === 'preview'}>{t('preview')}</Button>
              <Button variant="secondary" onClick={lint} disabled={!selected} loading={busy === 'lint'}>{t('lint')}</Button>
              <Button variant="primary" onClick={render} disabled={!selected} loading={busy === 'render'}>{t('render')}</Button>
            </div>
          </header>

          {error && <div className="hf-error">{error}</div>}

          <div className="hf-stage-row">
            <section className="hf-preview">
              {preview?.url ? (
                <iframe title={t('previewIframeTitle')} src={preview.url} />
              ) : (
                <div className="hf-canvas">
                  <div className="hf-canvas-inner">
                    <span>1920 x 1080</span>
                    <strong>{selected?.title || 'HyperFrames'}</strong>
                    <small>{t('previewPlaceholder')}</small>
                  </div>
                </div>
              )}
            </section>

            <aside className="hf-inspector">
              <div className="hf-panel">
                <h3>{t('renderPanel')}</h3>
                <label>
                  {t('format')}
                  <Select
                    value={format}
                    onChange={setFormat}
                    options={formatOptions}
                  />
                </label>
                <label>
                  {t('quality')}
                  <Select
                    value={quality}
                    onChange={setQuality}
                    options={renderQualityOptions.map((option) => ({ value: option.value, label: t(option.labelKey) }))}
                  />
                </label>
                <label>
                  {t('fps')}
                  <Select
                    value={fps}
                    onChange={setFps}
                    options={[
                      { value: '24', label: '24' },
                      { value: '30', label: '30' },
                      { value: '60', label: '60' },
                    ]}
                  />
                </label>
              </div>

              <div className="hf-panel">
                <h3>{t('diagnostics')}</h3>
                <StatusLine label="HyperFrames" ok={diagnostics?.ok} detail={diagnostics?.checks?.[0]?.detail || t('notChecked')} />
                <StatusLine label={t('diagnosticsProjects')} ok detail={String(diagnostics?.projects ?? projects.length)} />
              </div>
            </aside>
          </div>

          <section className="hf-timeline">
            <div className="hf-time-ruler">
              {Array.from({ length: 9 }, (_, index) => <span key={index}>{t('seconds', { value: index })}</span>)}
            </div>
            <div className="hf-track-grid">
              {[0, 1].map((track) => (
                <div className="hf-track" key={track}>
                  <span className="hf-track-label">T{track + 1}</span>
                  <div className="hf-track-lane">
                    {timelineClips.filter((clip) => clip.track === track).map((clip) => (
                      <button
                        key={clip.id}
                        className="hf-clip"
                        style={{ left: `${(clip.start / 8) * 100}%`, width: `${(clip.duration / 8) * 100}%` }}
                      >
                        {t(clip.labelKey)}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </section>

        <aside className="hf-output">
          <h3>{t('outputs')}</h3>
          {selected?.outputs.map((output) => (
            <div className="hf-output-item" key={output.id}>
              <span>{output.label}</span>
              <small>{output.format.toUpperCase()} · {formatBytes(output.bytes, t)}</small>
            </div>
          ))}
          {!selected?.outputs.length && <p className="hf-muted">{t('noRenders')}</p>}

          <h3>{t('tasks')}</h3>
          {tasks.slice(0, 8).map((task) => (
            <div className="hf-task" key={task.id} data-status={task.status}>
              <span>{taskTypeLabel(task.type, t)}</span>
              <small>{taskStatusLabel(task.status, t)}</small>
            </div>
          ))}
          {!tasks.length && <p className="hf-muted">{t('noTasks')}</p>}
        </aside>
      </main>
    </HanaThemeProvider>
  );
}

function StatusLine({ label, ok, detail }: { label: string; ok?: boolean; detail: string }) {
  return (
    <div className="hf-status">
      <span className={ok ? 'is-ok' : 'is-warn'} />
      <div>
        <strong>{label}</strong>
        <small>{detail}</small>
      </div>
    </div>
  );
}

function messageOf(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function formatBytes(bytes: number | null, t: Translate) {
  if (!bytes) return t('sizeUnknown');
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function taskTypeLabel(type: string, t: Translate) {
  return taskTypeKeys[type] ? t(taskTypeKeys[type]) : type;
}

function taskStatusLabel(status: string, t: Translate) {
  return taskStatusKeys[status] ? t(taskStatusKeys[status]) : status;
}
