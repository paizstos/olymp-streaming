document.addEventListener('DOMContentLoaded', () => {
  const fileInput = document.getElementById('avatarFile');
  const hiddenUrl = document.getElementById('avatarUrl');
  const preview = document.getElementById('avatarPreview');
  const uploadStatus = document.getElementById('avatarUploadStatus');
  const maxSize = 3 * 1024 * 1024; // 3 Mo
  const cropperModal = document.getElementById('cropperModal');
  const cropperImage = document.getElementById('cropperImage');
  const btnCancel = document.getElementById('cropperCancel');
  const btnValidate = document.getElementById('cropperValidate');
  let cropperInstance = null;

  const cloudName = hiddenUrl?.dataset.cloudinaryCloud || '';
  const uploadPreset = hiddenUrl?.dataset.cloudinaryPreset || '';

  const setStatus = (message, isError = false) => {
    if (!uploadStatus) return;
    uploadStatus.textContent = message || '';
    uploadStatus.classList.toggle('text-error', Boolean(isError));
  };

  const setPreview = (src) => {
    if (!src || !preview) return;
    preview.style.backgroundImage = `url('${src}')`;
    if (hiddenUrl) hiddenUrl.value = src;
  };

  const uploadAvatar = async (blob) => {
    if (!cloudName || !uploadPreset) {
      throw new Error('Configuration Cloudinary manquante.');
    }

    const formData = new FormData();
    formData.append('file', blob);
    formData.append('upload_preset', uploadPreset);
    formData.append('folder', 'olymp/avatars');

    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData
    });

    const payload = await response.json();
    if (!response.ok || !payload.secure_url) {
      throw new Error(payload?.error?.message || 'Upload avatar impossible.');
    }

    return payload.secure_url;
  };

  const openCropper = (dataUrl) => {
    if (!cropperModal || !cropperImage) return setPreview(dataUrl);
    cropperImage.src = dataUrl;
    cropperModal.classList.add('open');
    cropperInstance?.destroy?.();
    if (window.Cropper) {
      cropperInstance = new Cropper(cropperImage, {
        aspectRatio: 1,
        viewMode: 1,
        background: false,
        autoCropArea: 1
      });
    } else {
      setPreview(dataUrl);
    }
  };

  const closeCropper = () => {
    cropperModal?.classList.remove('open');
    cropperInstance?.destroy?.();
    cropperInstance = null;
  };

  if (btnCancel) btnCancel.addEventListener('click', closeCropper);
  if (btnValidate) {
    btnValidate.addEventListener('click', async () => {
      if (!cropperInstance) {
        closeCropper();
        return;
      }

      try {
        btnValidate.disabled = true;
        setStatus('Upload de la photo en cours...');
        const canvas = cropperInstance.getCroppedCanvas({ width: 400, height: 400, fillColor: '#021528' });
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.86));
        if (!blob) throw new Error('Recadrage impossible.');

        const uploadedUrl = await uploadAvatar(blob);
        setPreview(uploadedUrl);
        setStatus('Photo prête. Clique sur Enregistrer pour sauvegarder ton profil.');
        closeCropper();
      } catch (err) {
        console.error('Avatar upload error:', err);
        setStatus(err.message || 'Upload impossible.', true);
      } finally {
        btnValidate.disabled = false;
      }
    });
  }

  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (file.size > maxSize) {
        alert('Image trop lourde (max 3 Mo).');
        fileInput.value = '';
        return;
      }
      const reader = new FileReader();
      reader.onload = () => openCropper(reader.result);
      reader.readAsDataURL(file);
    });
  }
});
