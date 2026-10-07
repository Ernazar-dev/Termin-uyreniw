import { SearchOutlined } from '@ant-design/icons';
import { Input, Pagination } from 'antd';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { termsApi } from '../../../api';
import {
  CardsSkeleton,
  ChapterSelect,
  ClassSelect,
  EmptyState,
  ErrorState,
  PageHeader,
  TermCard,
} from '../../../components';
import { useCatalog } from '../../../hooks/useCatalog';
import { useDebounce } from '../../../hooks/useDebounce';
import { useRequest } from '../../../hooks/useRequest';
import styles from '../../../styles/page.module.scss';
import { DEFAULT_PAGE_SIZE, ROUTES } from '../../../utils/constants';

const StudentTerms = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlSearch = searchParams.get('search') ?? '';
  const [search, setSearch] = useState(urlSearch);
  const [classId, setClassId] = useState<number>();
  const [chapterId, setChapterId] = useState<number>();
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search.trim());
  const { classes, chapters } = useCatalog();

  // Header search navigates here with ?search=...
  useEffect(() => {
    setSearch(urlSearch);
    setPage(1);
  }, [urlSearch]);

  const { data, loading, error, reload } = useRequest(
    () =>
      termsApi.list({ search: debouncedSearch || undefined, classId, chapterId, page, pageSize: DEFAULT_PAGE_SIZE }),
    [debouncedSearch, classId, chapterId, page],
  );

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
    setSearchParams(value ? { search: value } : {}, { replace: true });
  };

  return (
    <>
      <PageHeader title="Terminler" subtitle="Termin atı, klass yamasa bap boyınsha izleń" />

      <div className={`${styles.toolbar} ${styles.termToolbar}`}>
        <Input
          allowClear
          size="large"
          prefix={<SearchOutlined />}
          placeholder="Termindi izlew..."
          value={search}
          onChange={(event) => handleSearchChange(event.target.value)}
          aria-label="Termindi izlew"
        />
        <ClassSelect
          classes={classes}
          size="large"
          value={classId}
          allowClear
          placeholder="Barlıq klasslar"
          onChange={(value) => {
            setClassId(value);
            setChapterId(undefined);
            setPage(1);
          }}
        />
        <ChapterSelect
          chapters={chapters}
          classId={classId}
          size="large"
          value={chapterId}
          allowClear
          placeholder="Barlıq baplar"
          onChange={(value) => {
            setChapterId(value);
            setPage(1);
          }}
        />
      </div>

      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : loading || !data ? (
        <CardsSkeleton />
      ) : data.items.length === 0 ? (
        <EmptyState
          description={
            debouncedSearch
              ? `«${debouncedSearch}» boyınsha termin tabılmadı. Aqıllı járdemshiden sorap kóriń.`
              : 'Házirge shekem termin qosılmaǵan.'
          }
          action={
            debouncedSearch && (
              <Link to={ROUTES.student.ai} state={{ question: `${debouncedSearch} degen ne?` }}>
                Aqıllı járdemshige ótiw
              </Link>
            )
          }
        />
      ) : (
        <>
          <div className={styles.grid}>
            {data.items.map((term) => (
              <TermCard key={term.id} term={term} onClick={() => navigate(ROUTES.student.term(term.id))} />
            ))}
          </div>
          {data.total > DEFAULT_PAGE_SIZE && (
            <Pagination
              responsive
              showLessItems
              style={{ marginTop: 24, justifyContent: 'center' }}
              current={page}
              pageSize={DEFAULT_PAGE_SIZE}
              total={data.total}
              onChange={setPage}
              showSizeChanger={false}
            />
          )}
        </>
      )}
    </>
  );
};

export default StudentTerms;
