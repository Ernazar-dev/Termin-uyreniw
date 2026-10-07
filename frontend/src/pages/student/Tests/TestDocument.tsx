import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Space, Spin, Typography } from 'antd';
import { useEffect, useRef, useState } from 'react';
import { testsApi } from '../../../api';
import type { TestDetail } from '../../../types/models';
import { resolveImageUrl } from '../../../utils/format';
import styles from './TestPlay.module.scss';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

const PdfPages = ({ url }: { url: string }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [text, setText] = useState('');
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    let dispose: (() => void) | undefined;
    setLoading(true);
    setError(false);
    void (async () => {
      const pdfjs = await import('pdfjs-dist');
      if (!active) return;
      pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
      const task = pdfjs.getDocument({ url });
      dispose = () => { void task.destroy(); };
      const document = await task.promise;
      if (!active) return;
      setTotal(document.numPages);
      const sheet = await document.getPage(page);
      if (!active || !canvasRef.current) return;
      const canvas = canvasRef.current;
      const viewport = sheet.getViewport({ scale: Math.min(2, 1400 / sheet.getViewport({ scale: 1 }).width) });
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      await sheet.render({ canvas, viewport }).promise;
      const content = await sheet.getTextContent();
      if (active) setText(content.items.map(item => 'str' in item ? item.str : '').join(' '));
    })().catch(() => { if (active) setError(true); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; dispose?.(); };
  }, [url, page, retry]);
  return (
    <>
      <div className={styles.documentControls}>
        <Button icon={<LeftOutlined />} aria-label="Aldınǵı bet" disabled={page <= 1 || loading} onClick={() => setPage(value => value - 1)} />
        <Typography.Text>{page} / {total || '…'}</Typography.Text>
        <Button icon={<RightOutlined />} aria-label="Keyingi bet" disabled={page >= total || loading} onClick={() => setPage(value => value + 1)} />
      </div>
      <div className={styles.documentBody} aria-busy={loading}>
        {loading && <Spin />}
        {error && <Alert type="error" title="PDF faylın oqıw múmkin bolmadı" action={<Button onClick={() => setRetry(value => value + 1)}>Qayta urınıw</Button>} />}
        <canvas ref={canvasRef} className={styles.pdfCanvas} style={{ display: loading || error ? 'none' : 'block' }} role="img" aria-label={`${page}-bet`} />
        <div className={styles.readerText}>{text}</div>
      </div>
    </>
  );
};

const WordPages = ({ url, test }: { url: string; test: TestDetail }) => {
  const [html, setHtml] = useState('');
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    setLoading(true);
    setError(false);
    void (async () => {
      if (/\.doc$/i.test(test.fileUrl || '')) {
        const result = await testsApi.document(test.id);
        if (active) setText(result.text);
        return;
      }
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) throw new Error('Document unavailable');
      const blob = await response.blob();
      const { renderAsync } = await import('docx-preview');
      if (!active) return;
      const body = document.createElement('div');
      const css = document.createElement('div');
      await renderAsync(blob, body, css, { inWrapper: false, ignoreWidth: true, ignoreHeight: true, useBase64URL: true, renderComments: false, renderAltChunks: false });
      // Render generated markup in a script-free isolated frame. No remote resources.
      body.querySelectorAll('a').forEach(link => link.removeAttribute('href'));
      if (active) setHtml(`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data: blob:; font-src data: blob:; style-src 'unsafe-inline'"><style>body{margin:0;padding:16px;font-family:Arial,sans-serif;color:#1e2140}section.docx{padding:16px!important;max-width:100%;box-sizing:border-box}img,svg{max-width:100%}table{max-width:100%}p{overflow-wrap:anywhere}</style>${css.innerHTML}</head><body>${body.innerHTML}</body></html>`);
    })().catch(() => { if (active) setError(true); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; controller.abort(); };
  }, [url, test.id, test.fileUrl, retry]);
  if (loading) return <div className={styles.documentBody}><Spin /></div>;
  if (error) return <Alert type="error" title="Word faylın oqıw múmkin bolmadı" action={<Button onClick={() => setRetry(value => value + 1)}>Qayta urınıw</Button>} />;
  return html
    ? <iframe className={styles.viewer} title={test.fileName || 'Test hújjeti'} sandbox="" srcDoc={html} />
    : <div className={`${styles.documentBody} ${styles.wordText}`}>{text}</div>;
};

export const TestDocument = ({ test }: { test: TestDetail }) => {
  const url = resolveImageUrl(test.fileUrl);
  if (!url) return null;
  return (
    <Card className={styles.fileCard} styles={{ body: { padding: 0 } }}>
      <div className={styles.fileBar}><Space><Typography.Text strong>{test.fileName || 'Test hújjeti'}</Typography.Text></Space></div>
      {/\.pdf$/i.test(test.fileUrl || '') ? <PdfPages key={url} url={url} /> : <WordPages key={url} url={url} test={test} />}
    </Card>
  );
};
