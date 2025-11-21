'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface BacklogPhoto {
  id: string;
  image_url: string;
  thumbnail_url: string | null;
  original_filename: string | null;
  file_size: number | null;
  width: number | null;
  height: number | null;
  notes: string | null;
  tags: string[] | null;
  uploaded_at: string;
  updated_at: string;
}

interface Section {
  id: string;
  name: string;
  section_code: string;
  category: string;
}

interface PhotoBacklogProps {
  sections: Section[];
}

export default function PhotoBacklog({ sections }: PhotoBacklogProps) {
  const [photos, setPhotos] = useState<BacklogPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<BacklogPhoto | null>(null);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState('');
  const [tagsValue, setTagsValue] = useState('');

  useEffect(() => {
    loadPhotos();
  }, []);

  const loadPhotos = async () => {
    try {
      const response = await fetch('/api/backlog');
      const data = await response.json();
      setPhotos(data.photos || []);
    } catch (error) {
      console.error('Error loading backlog photos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/backlog/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        await loadPhotos();
        e.target.value = '';
      } else {
        alert('Failed to upload photo');
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      alert('Error uploading photo');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (photoId: string) => {
    if (!confirm('Are you sure you want to delete this photo?')) return;

    try {
      const response = await fetch(`/api/backlog/${photoId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await loadPhotos();
        if (selectedPhoto?.id === photoId) {
          setSelectedPhoto(null);
        }
      } else {
        alert('Failed to delete photo');
      }
    } catch (error) {
      console.error('Error deleting photo:', error);
      alert('Error deleting photo');
    }
  };

  const handleAssignToSection = async (photoId: string, sectionId: string) => {
    try {
      const response = await fetch(`/api/backlog/${photoId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sectionId, deleteAfterAssign: true }),
      });

      if (response.ok) {
        await loadPhotos();
        if (selectedPhoto?.id === photoId) {
          setSelectedPhoto(null);
        }
        alert('Photo assigned to section successfully!');
      } else {
        alert('Failed to assign photo to section');
      }
    } catch (error) {
      console.error('Error assigning photo:', error);
      alert('Error assigning photo');
    }
  };

  const handleUpdateNotes = async () => {
    if (!selectedPhoto) return;

    try {
      const response = await fetch(`/api/backlog/${selectedPhoto.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notes: notesValue,
          tags: tagsValue.split(',').map(t => t.trim()).filter(Boolean),
        }),
      });

      if (response.ok) {
        await loadPhotos();
        setEditingNotes(false);
        // Update selected photo
        const updatedPhoto = photos.find(p => p.id === selectedPhoto.id);
        if (updatedPhoto) setSelectedPhoto(updatedPhoto);
      } else {
        alert('Failed to update notes');
      }
    } catch (error) {
      console.error('Error updating notes:', error);
      alert('Error updating notes');
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Unknown';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-gray-400">Loading backlog...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h2 className="text-xl font-semibold mb-4">Upload Photos to Backlog</h2>
        <div className="flex items-center gap-4">
          <label className="flex-1">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              disabled={uploading}
              className="hidden"
              id="photo-upload"
            />
            <div
              className={`
                border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
                ${uploading ? 'border-gray-600 bg-gray-700' : 'border-gray-600 hover:border-blue-500 hover:bg-gray-700'}
              `}
              onClick={() => document.getElementById('photo-upload')?.click()}
            >
              {uploading ? (
                <div className="text-gray-400">Uploading...</div>
              ) : (
                <>
                  <div className="text-gray-300 font-medium">Click to upload photo</div>
                  <div className="text-gray-500 text-sm mt-1">or drag and drop</div>
                </>
              )}
            </div>
          </label>
        </div>
        <div className="mt-4 text-sm text-gray-400">
          Photos uploaded here will be stored in the backlog until you assign them to a section.
        </div>
      </div>

      {/* Stats */}
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <div className="text-sm text-gray-400">
          <span className="font-semibold text-white">{photos.length}</span> photos in backlog
        </div>
      </div>

      {/* Photo Grid and Detail View */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Photo Grid */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Photos</h3>
          {photos.length === 0 ? (
            <div className="bg-gray-800 rounded-lg p-12 border border-gray-700 text-center">
              <div className="text-gray-400">No photos in backlog</div>
              <div className="text-gray-500 text-sm mt-1">Upload some photos to get started</div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {photos.map((photo) => (
                <div
                  key={photo.id}
                  className={`
                    relative bg-gray-800 rounded-lg overflow-hidden cursor-pointer border-2
                    ${selectedPhoto?.id === photo.id ? 'border-blue-500' : 'border-gray-700 hover:border-gray-600'}
                  `}
                  onClick={() => {
                    setSelectedPhoto(photo);
                    setEditingNotes(false);
                    setNotesValue(photo.notes || '');
                    setTagsValue(photo.tags?.join(', ') || '');
                  }}
                >
                  <div className="aspect-video relative">
                    <Image
                      src={photo.thumbnail_url || photo.image_url}
                      alt={photo.original_filename || 'Backlog photo'}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="p-2">
                    <div className="text-xs text-gray-400 truncate">
                      {photo.original_filename}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatDate(photo.uploaded_at)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Detail View */}
        {selectedPhoto && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Photo Details</h3>
            <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
              {/* Image Preview */}
              <div className="relative aspect-video">
                <Image
                  src={selectedPhoto.image_url}
                  alt={selectedPhoto.original_filename || 'Selected photo'}
                  fill
                  className="object-contain bg-black"
                />
              </div>

              {/* Details */}
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-gray-400">Filename:</div>
                  <div className="text-gray-200">{selectedPhoto.original_filename}</div>

                  <div className="text-gray-400">Dimensions:</div>
                  <div className="text-gray-200">
                    {selectedPhoto.width} × {selectedPhoto.height}
                  </div>

                  <div className="text-gray-400">Size:</div>
                  <div className="text-gray-200">{formatFileSize(selectedPhoto.file_size)}</div>

                  <div className="text-gray-400">Uploaded:</div>
                  <div className="text-gray-200">{formatDate(selectedPhoto.uploaded_at)}</div>
                </div>

                {/* Notes */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-300">Notes</label>
                    {!editingNotes && (
                      <button
                        onClick={() => setEditingNotes(true)}
                        className="text-xs text-blue-400 hover:text-blue-300"
                      >
                        Edit
                      </button>
                    )}
                  </div>
                  {editingNotes ? (
                    <div className="space-y-2">
                      <textarea
                        value={notesValue}
                        onChange={(e) => setNotesValue(e.target.value)}
                        placeholder="Add notes..."
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm text-white"
                        rows={3}
                      />
                      <input
                        type="text"
                        value={tagsValue}
                        onChange={(e) => setTagsValue(e.target.value)}
                        placeholder="Tags (comma separated)"
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm text-white"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleUpdateNotes}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setEditingNotes(false);
                            setNotesValue(selectedPhoto.notes || '');
                            setTagsValue(selectedPhoto.tags?.join(', ') || '');
                          }}
                          className="px-3 py-1 bg-gray-600 hover:bg-gray-700 rounded text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="text-sm text-gray-300 mb-2">
                        {selectedPhoto.notes || 'No notes'}
                      </div>
                      {selectedPhoto.tags && selectedPhoto.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {selectedPhoto.tags.map((tag, i) => (
                            <span
                              key={i}
                              className="px-2 py-1 bg-gray-700 rounded text-xs text-gray-300"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Actions */}
                <div className="space-y-2 pt-2 border-t border-gray-700">
                  <div className="text-sm font-medium text-gray-300 mb-2">Assign to Section</div>
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        handleAssignToSection(selectedPhoto.id, e.target.value);
                      }
                    }}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm text-white"
                    defaultValue=""
                  >
                    <option value="" disabled>Select a section...</option>
                    {sections.map((section) => (
                      <option key={section.id} value={section.id}>
                        {section.name} ({section.section_code})
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={() => handleDelete(selectedPhoto.id)}
                    className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-sm"
                  >
                    Delete Photo
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
