import { Select, type SelectProps } from 'antd';
import { useMemo } from 'react';
import type { Chapter, ClassItem } from '../../types/models';

interface ClassSelectProps extends Omit<SelectProps<number>, 'options'> {
  classes: ClassItem[];
}

export const ClassSelect = ({ classes, placeholder = 'Klass', ...rest }: ClassSelectProps) => (
  <Select<number>
    placeholder={placeholder}
    options={classes.map((item) => ({ value: item.id, label: item.name }))}
    {...rest}
  />
);

interface ChapterSelectProps extends Omit<SelectProps<number>, 'options'> {
  chapters: Chapter[];
  /** Show only chapters of this class. */
  classId?: number;
}

/** Chapters grouped by class — usable both as a filter and as a form control. */
export const ChapterSelect = ({ chapters, classId, placeholder = 'Bap', ...rest }: ChapterSelectProps) => {
  const options = useMemo(() => {
    const visible = classId ? chapters.filter((chapter) => chapter.classId === classId) : chapters;
    const groups = new Map<number, { label: string; options: { value: number; label: string }[] }>();
    for (const chapter of visible) {
      const group = groups.get(chapter.classId) ?? { label: chapter.class.name, options: [] };
      group.options.push({ value: chapter.id, label: chapter.title });
      groups.set(chapter.classId, group);
    }
    return [...groups.values()];
  }, [chapters, classId]);

  return (
    <Select<number>
      placeholder={placeholder}
      options={options}
      showSearch={{ optionFilterProp: 'label' }}
      {...rest}
    />
  );
};
