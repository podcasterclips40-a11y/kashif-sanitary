import React, { useState, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext.jsx';
import { api } from '../api.js';
import {
  Database,
  Image as ImageIcon,
  Trash2,
  RefreshCw,
  Check,
  AlertCircle,
  Camera,
  Link as LinkIcon,
  X,
} from 'lucide-react';

/**
 * Compresses and downscales photos in the browser before sending to Turso database.
 * Keeps image quality clear and crisp while producing ~60-250 KB files.
 */
async function compressImage(file, maxWidth = 1200, maxHeight = 1200, quality = 0.82) {
  // If file is already small (under 250KB), no need to re-encode
  if (file.size <= 250 * 1024) {
    return file;
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              return resolve(file);
            }
            const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, '.jpg'), {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = () => resolve(file);
    };
    reader.onerror = () => resolve(file);
  });
}

export default function ImageUploader({
  value = '',
  onChange,
  folder = 'products',
  label = 'Cover Image',
  aspectRatio = 'aspect-[4/3]',
  fallbackPlaceholder = 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80',
}) {
  const { lang, t } = useLanguage();
  const fileInputRef = useRef(null);

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [manualUrl, setManualUrl] = useState(value || '');

  // Resolved URL for rendering
  const displaySrc = api.getImageUrl(value);

  const handleFileChange = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    setErrorMsg('');
    setSuccessMsg('');

    // Validate type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      setErrorMsg(
        lang === 'ur'
          ? 'غلط فائل فارمیٹ۔ صرف JPG، PNG یا WebP تصاویر منتخب کریں۔'
          : 'Invalid file format. Please choose a JPG, PNG, or WebP image.'
      );
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(25);

      // Downscale/compress image for Turso database storage
      const optimizedFile = await compressImage(file);
      setUploadProgress(55);

      // Validate size (max 2.5 MB after compression)
      if (optimizedFile.size > 2.5 * 1024 * 1024) {
        throw new Error(
          lang === 'ur'
            ? 'تصویر کا سائز 2.5 ایم بی سے زیادہ ہے۔ براہ کرم چھوٹی تصویر منتخب کریں۔'
            : 'Image size exceeds 2.5 MB maximum limit for Turso database storage.'
        );
      }

      // Upload directly into Turso database via backend API
      const res = await api.uploadImage(optimizedFile, folder);

      if (res.success && res.url) {
        setUploadProgress(100);
        onChange(res.url);
        setManualUrl(res.url);
        setSuccessMsg(
          lang === 'ur'
            ? 'تصویر کامیابی سے ٹرسو ڈیٹا بیس میں محفوظ ہو گئی!'
            : 'Image saved directly in Turso database!'
        );
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        throw new Error(res.error || 'Failed to save image in Turso database');
      }
    } catch (err) {
      console.error('Image Upload Error:', err);
      setErrorMsg(err.message || 'Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = () => {
    onChange('');
    setManualUrl('');
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleApplyManualUrl = () => {
    if (manualUrl.trim()) {
      onChange(manualUrl.trim());
      setShowUrlInput(false);
    }
  };

  return (
    <div className="space-y-2">
      {label && (
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold text-slate-700">
            {label}
          </label>
          <button
            type="button"
            onClick={() => setShowUrlInput(!showUrlInput)}
            className="text-[11px] text-brand-600 hover:text-brand-800 font-semibold inline-flex items-center gap-1"
          >
            <LinkIcon className="w-3 h-3" />
            <span>{showUrlInput ? 'Hide URL input' : 'Enter Direct URL'}</span>
          </button>
        </div>
      )}

      {/* Manual URL Input Bar (optional toggle) */}
      {showUrlInput && (
        <div className="flex gap-2 p-2 bg-slate-50 border border-slate-200 rounded-xl">
          <input
            type="url"
            value={manualUrl}
            onChange={(e) => setManualUrl(e.target.value)}
            placeholder="https://... or /api/public/images/..."
            className="flex-1 text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg font-mono bg-white"
          />
          <button
            type="button"
            onClick={handleApplyManualUrl}
            className="px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-bold shrink-0"
          >
            Apply
          </button>
        </div>
      )}

      {/* Main Upload / Preview Area */}
      <div className="border-2 border-dashed border-slate-300 hover:border-brand-400 rounded-2xl p-3 sm:p-4 bg-slate-50/60 transition-colors">
        {value ? (
          // Preview with Replace / Remove controls
          <div className="space-y-3">
            <div className={`relative ${aspectRatio} rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shadow-xs max-h-56 mx-auto`}>
              <img
                src={displaySrc || fallbackPlaceholder}
                alt="Cover Preview"
                onError={(e) => {
                  e.target.src = fallbackPlaceholder;
                }}
                className="w-full h-full object-cover"
              />

              {uploading && (
                <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs flex flex-col items-center justify-center text-white p-4">
                  <RefreshCw className="w-6 h-6 animate-spin mb-2 text-brand-400" />
                  <span className="text-xs font-bold">Saving image in Turso database...</span>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <span className="text-[11px] text-slate-500 font-mono truncate max-w-xs flex items-center gap-1" title={value}>
                <Database className="w-3 h-3 text-brand-600 shrink-0" />
                <span>{value.length > 40 ? value.substring(0, 40) + '...' : value}</span>
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => fileInputRef.current && fileInputRef.current.click()}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition-colors disabled:opacity-50 shadow-xs"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{lang === 'ur' ? 'تصویر تبدیل کریں' : 'Replace Image'}</span>
                </button>

                <button
                  type="button"
                  disabled={uploading}
                  onClick={handleRemove}
                  className="px-2.5 py-1.5 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg text-xs font-bold inline-flex items-center gap-1 transition-colors disabled:opacity-50"
                  title="Remove image"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{lang === 'ur' ? 'حذف کریں' : 'Remove'}</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          // Empty State: Tap/Drag to Upload
          <div
            onClick={() => !uploading && fileInputRef.current && fileInputRef.current.click()}
            className="text-center py-6 px-4 cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 group-hover:bg-brand-100 flex items-center justify-center mx-auto mb-2.5 transition-colors shadow-xs">
              {uploading ? (
                <RefreshCw className="w-6 h-6 animate-spin text-brand-600" />
              ) : (
                <Camera className="w-6 h-6" />
              )}
            </div>

            {uploading ? (
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-800">
                  {lang === 'ur' ? 'تصویر ٹرسو ڈیٹا بیس میں محفوظ ہو رہی ہے...' : 'Saving image binary into Turso database...'}
                </p>
                <div className="w-36 h-1.5 bg-slate-200 rounded-full mx-auto overflow-hidden">
                  <div
                    className="h-full bg-brand-600 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <p className="text-xs sm:text-sm font-bold text-slate-800 group-hover:text-brand-600 transition-colors">
                  {lang === 'ur'
                    ? 'تصویر منتخب کریں (فون گیلری، کیمرہ یا کمپیوٹر)'
                    : 'Tap to upload cover image (Phone Library, Camera, or Files)'}
                </p>
                <p className="text-[11px] text-slate-400">
                  JPG, PNG, WebP • Stored directly as BLOB in Turso database (Max 2.5 MB)
                </p>
              </div>
            )}
          </div>
        )}

        {/* Hidden Native File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {/* Status Messages */}
      {errorMsg && (
        <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2 animate-shake">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-2">
          <Check className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
    </div>
  );
}
