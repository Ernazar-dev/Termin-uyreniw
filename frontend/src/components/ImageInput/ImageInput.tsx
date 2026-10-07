import { DeleteOutlined, PictureOutlined } from '@ant-design/icons';
import { App, Button, Upload } from 'antd';
import { useEffect, useMemo } from 'react';
import { ALLOWED_IMAGE_TYPES, IMAGE_ACCEPT, IMAGE_MAX_SIZE_MB } from '../../utils/constants';
import { resolveImageUrl } from '../../utils/format';
import styles from './ImageInput.module.scss';

export interface ImageValue {
  /** Newly selected file (not uploaded yet). */
  file: File | null;
  /** Path of the image already stored on the server. */
  existing: string | null;
}

interface ImageInputProps {
  value?: ImageValue;
  onChange?: (value: ImageValue) => void;
}

const EMPTY: ImageValue = { file: null, existing: null };

/** Optional image picker: validates type/size locally, the upload happens with the form submit. */
export const ImageInput = ({ value = EMPTY, onChange }: ImageInputProps) => {
  const { message } = App.useApp();

  const previewUrl = useMemo(
    () => (value.file ? URL.createObjectURL(value.file) : resolveImageUrl(value.existing)),
    [value.file, value.existing],
  );

  useEffect(
    () => () => {
      if (value.file && previewUrl) URL.revokeObjectURL(previewUrl);
    },
    [value.file, previewUrl],
  );

  const handleSelect = (file: File) => {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      message.error('Tek ǵana jpg, jpeg, png yamasa webp súwretler qabıl etiledi');
      return Upload.LIST_IGNORE;
    }
    if (file.size > IMAGE_MAX_SIZE_MB * 1024 * 1024) {
      message.error(`Súwret kólemi ${IMAGE_MAX_SIZE_MB} MB dan aspawı kerek`);
      return Upload.LIST_IGNORE;
    }
    onChange?.({ ...value, file });
    // Prevent antd from uploading on its own
    return false;
  };

  if (previewUrl) {
    return (
      <div className={styles.preview}>
        <img src={previewUrl} alt="Termin súwreti" />
        <Button danger icon={<DeleteOutlined />} onClick={() => onChange?.(EMPTY)}>
          Súwretti alıp taslaw
        </Button>
      </div>
    );
  }

  return (
    <Upload.Dragger accept={IMAGE_ACCEPT} showUploadList={false} beforeUpload={handleSelect} maxCount={1}>
      <p className={styles.icon}>
        <PictureOutlined />
      </p>
      <p>Súwret júklew (májbúriy emes)</p>
      <p className={styles.hint}>
        jpg, jpeg, png, webp · {IMAGE_MAX_SIZE_MB} MB ǵa shekem
      </p>
    </Upload.Dragger>
  );
};
