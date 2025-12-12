document.addEventListener('DOMContentLoaded', () => {
  const fileInput = document.getElementById('avatarFile');
  const urlInput = document.getElementById('avatarInput');
  const hiddenUrl = document.getElementById('avatarUrl');
  const preview = document.getElementById('avatarPreview');
  const maxSize = 2 * 1024 * 1024; // 2 Mo

  const setPreview = (src) => {
    if (!src || !preview) return;
    preview.style.backgroundImage = `url('${src}')`;
    if (hiddenUrl) hiddenUrl.value = src;
  };

  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (file.size > maxSize) {
        alert('Image trop lourde (max 2 Mo).');
        fileInput.value = '';
        return;
      }
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result);
      reader.readAsDataURL(file);
    });
  }

  if (urlInput) {
    urlInput.addEventListener('input', (e) => {
      const val = e.target.value.trim();
      setPreview(val);
    });
  }
});
