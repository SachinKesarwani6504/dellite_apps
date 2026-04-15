import { MultipartFile } from '@/types/http';

type FormDataPrimitive = string | number | boolean | null | undefined;
type FormDataValue = FormDataPrimitive | Record<string, unknown> | unknown[];

export type FormDataFilesMap = Record<string, MultipartFile | MultipartFile[] | undefined>;

function appendPrimitive(formData: FormData, key: string, value: FormDataPrimitive) {
  if (value === undefined || value === null) return;
  formData.append(key, String(value));
}

function toUploadPart(file: MultipartFile) {
  return {
    uri: file.uri,
    name: file.name,
    type: file.type ?? 'application/octet-stream',
  };
}

function appendFile(formData: FormData, key: string, file: MultipartFile | undefined) {
  if (!file || !file.uri || !file.name) return;
  formData.append(key, toUploadPart(file) as unknown as Blob);
}

export function toFormData(
  payload: Record<string, FormDataValue>,
  filesMap?: FormDataFilesMap,
): FormData {
  const formData = new FormData();

  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      appendPrimitive(formData, key, value);
      return;
    }
    formData.append(key, JSON.stringify(value));
  });

  if (filesMap) {
    Object.entries(filesMap).forEach(([key, value]) => {
      if (!value) return;
      if (Array.isArray(value)) {
        value.forEach(file => appendFile(formData, key, file));
        return;
      }
      appendFile(formData, key, value);
    });
  }

  return formData;
}
