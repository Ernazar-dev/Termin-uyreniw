import { Card, Tag, Typography } from 'antd';
import type { ReactNode } from 'react';
import type { Term } from '../../types/models';
import { resolveImageUrl } from '../../utils/format';
import styles from './TermCard.module.scss';

interface TermCardProps {
  term: Pick<Term, 'name' | 'definition' | 'example' | 'image'> & Partial<Pick<Term, 'chapter'>>;
  /** `compact` — card in a grid; `full` — detail view with large typography. */
  variant?: 'compact' | 'full';
  onClick?: () => void;
  extra?: ReactNode;
}

/**
 * The image is optional. Without it the card never reserves an empty image slot —
 * the text simply takes the full width.
 */
export const TermCard = ({ term, variant = 'compact', onClick, extra }: TermCardProps) => {
  const imageUrl = resolveImageUrl(term.image);
  const isFull = variant === 'full';

  const content = (
    <div className={styles.content}>
      {term.chapter && (
        <Tag className={styles.tag}>
          {term.chapter.class.name} · {term.chapter.title}
        </Tag>
      )}
      <Typography.Title level={isFull ? 2 : 4} className={isFull ? styles.titleFull : styles.title}>
        {term.name}
      </Typography.Title>

      <section className={styles.section}>
        <Typography.Text className={styles.label}>Mánisi</Typography.Text>
        <Typography.Paragraph
          className={isFull ? styles.textFull : styles.text}
          ellipsis={isFull ? false : { rows: 3 }}
        >
          {term.definition}
        </Typography.Paragraph>
      </section>

      {term.example && (
        <section className={styles.section}>
          <Typography.Text className={styles.label}>Mısal</Typography.Text>
          <Typography.Paragraph
            className={`${isFull ? styles.textFull : styles.text} ${styles.example}`}
            ellipsis={isFull ? false : { rows: 2 }}
          >
            {term.example}
          </Typography.Paragraph>
        </section>
      )}
      {extra}
    </div>
  );

  if (isFull) {
    return (
      <Card>
        <div className={imageUrl ? styles.fullWithImage : undefined}>
          {imageUrl && (
            <div className={styles.fullImage}>
              <img src={imageUrl} alt={term.name} loading="lazy" />
            </div>
          )}
          {content}
        </div>
      </Card>
    );
  }

  return (
    <Card
      hoverable={Boolean(onClick)}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (event) => {
        if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) {
          event.preventDefault();
          onClick();
        }
      } : undefined}
      className={styles.card}
      cover={
        imageUrl ? (
          <div className={styles.cover}>
            <img src={imageUrl} alt={term.name} loading="lazy" />
          </div>
        ) : undefined
      }
    >
      {content}
    </Card>
  );
};
