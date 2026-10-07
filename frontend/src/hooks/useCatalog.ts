import { chaptersApi, classesApi } from '../api';
import { useRequest } from './useRequest';

/** Classes + chapters used by filters and form selects. */
export const useCatalog = () => {
  const classes = useRequest(() => classesApi.list(), []);
  const chapters = useRequest(() => chaptersApi.list(), []);

  return {
    classes: classes.data ?? [],
    chapters: chapters.data ?? [],
    loading: classes.loading || chapters.loading,
    reload: () => {
      classes.reload();
      chapters.reload();
    },
  };
};
