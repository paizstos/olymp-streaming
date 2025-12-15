document.addEventListener('DOMContentLoaded', () => {
  const fileInput = document.getElementById('avatarFile');
  const hiddenUrl = document.getElementById('avatarUrl');
  const preview = document.getElementById('avatarPreview');
  const maxSize = 3 * 1024 * 1024; // 3 Mo
  const cropperModal = document.getElementById('cropperModal');
  const cropperImage = document.getElementById('cropperImage');
  const btnCancel = document.getElementById('cropperCancel');
  const btnValidate = document.getElementById('cropperValidate');
  let cropperInstance = null;

  const setPreview = (src) => {
    if (!src || !preview) return;
    preview.style.backgroundImage = `url('${src}')`;
    if (hiddenUrl) hiddenUrl.value = src;
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
    btnValidate.addEventListener('click', () => {
      if (cropperInstance) {
        const canvas = cropperInstance.getCroppedCanvas({ width: 400, height: 400, fillColor: '#021528' });
        const dataUrl = canvas.toDataURL('image/png');
        setPreview(dataUrl);
      }
      closeCropper();
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
