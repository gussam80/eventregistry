/**
 * Smooth Digital Signature Pad for Touch screens, Tablets, and Desktops
 * Provides bezier curve smoothing, touch event normalization, high-DPI scaling, and export
 */
class SignaturePad {
  constructor(canvasElement, options = {}) {
    this.canvas = typeof canvasElement === 'string' ? document.getElementById(canvasElement) : canvasElement;
    if (!this.canvas) {
      console.error('SignaturePad: Canvas element not found');
      return;
    }
    this.ctx = this.canvas.getContext('2d');
    this.options = Object.assign({
      strokeColor: '#0f172a',
      minWidth: 1.5,
      maxWidth: 3.5,
      dotSize: 2.5,
      backgroundColor: 'rgba(255, 255, 255, 0)',
      onBegin: null,
      onEnd: null
    }, options);

    this.points = [];
    this.isDrawing = false;
    this.isEmpty = true;
    this.history = [];

    this._initEvents();
    this.resizeCanvas();
  }

  _initEvents() {
    const canvas = this.canvas;

    // Mouse events
    canvas.addEventListener('mousedown', (e) => this._handlePointerDown(e));
    window.addEventListener('mousemove', (e) => {
      if (this.isDrawing) this._handlePointerMove(e);
    });
    window.addEventListener('mouseup', () => {
      if (this.isDrawing) this._handlePointerUp();
    });

    // Touch events (passive: false to prevent scrolling when signing)
    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (e.touches.length === 1) {
        this._handlePointerDown(e.touches[0]);
      }
    }, { passive: false });

    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      if (this.isDrawing && e.touches.length === 1) {
        this._handlePointerMove(e.touches[0]);
      }
    }, { passive: false });

    canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      if (this.isDrawing) {
        this._handlePointerUp();
      }
    }, { passive: false });

    // Window resize observer
    window.addEventListener('resize', () => this.resizeCanvas(false));
  }

  resizeCanvas(clear = true) {
    if (!this.canvas) return;
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    const rect = this.canvas.getBoundingClientRect();
    
    // Save current drawing if not clearing
    let data = null;
    if (!clear && !this.isEmpty) {
      data = this.toDataURL();
    }

    const width = rect.width || this.canvas.parentElement?.clientWidth || 400;
    const height = rect.height || 180;

    this.canvas.width = width * ratio;
    this.canvas.height = height * ratio;
    this.ctx.scale(ratio, ratio);

    if (data && !clear) {
      const img = new Image();
      img.onload = () => {
        this.ctx.drawImage(img, 0, 0, width, height);
      };
      img.src = data;
    } else if (clear) {
      this.clear();
    }
  }

  _getCoordinates(event) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
      time: Date.now()
    };
  }

  _handlePointerDown(event) {
    this.isDrawing = true;
    this.points = [];
    const point = this._getCoordinates(event);
    this.points.push(point);
    
    this.ctx.fillStyle = this.options.strokeColor;
    this.ctx.beginPath();
    this.ctx.arc(point.x, point.y, this.options.dotSize / 2, 0, Math.PI * 2, true);
    this.ctx.fill();

    this.isEmpty = false;
    if (typeof this.options.onBegin === 'function') {
      this.options.onBegin();
    }
  }

  _handlePointerMove(event) {
    if (!this.isDrawing) return;
    const point = this._getCoordinates(event);
    this.points.push(point);

    if (this.points.length > 2) {
      const p1 = this.points[this.points.length - 2];
      const p2 = this.points[this.points.length - 1];
      const p0 = this.points[this.points.length - 3];

      const mid1 = { x: (p0.x + p1.x) / 2, y: (p0.y + p1.y) / 2 };
      const mid2 = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };

      this.ctx.strokeStyle = this.options.strokeColor;
      this.ctx.lineWidth = this.options.maxWidth;
      this.ctx.lineCap = 'round';
      this.ctx.lineJoin = 'round';

      this.ctx.beginPath();
      this.ctx.moveTo(mid1.x, mid1.y);
      this.ctx.quadraticCurveTo(p1.x, p1.y, mid2.x, mid2.y);
      this.ctx.stroke();
    }
  }

  _handlePointerUp() {
    if (!this.isDrawing) return;
    this.isDrawing = false;
    this.points = [];
    if (typeof this.options.onEnd === 'function') {
      this.options.onEnd();
    }
  }

  clear() {
    if (!this.canvas) return;
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    this.ctx.clearRect(0, 0, this.canvas.width / ratio, this.canvas.height / ratio);
    this.points = [];
    this.isEmpty = true;
    this.isDrawing = false;
  }

  toDataURL(type = 'image/png', quality = 0.95) {
    if (this.isEmpty) return null;
    return this.canvas.toDataURL(type, quality);
  }

  fromDataURL(dataUrl) {
    if (!dataUrl) return;
    const img = new Image();
    img.onload = () => {
      this.clear();
      const rect = this.canvas.getBoundingClientRect();
      const width = rect.width || 400;
      const height = rect.height || 180;
      this.ctx.drawImage(img, 0, 0, width, height);
      this.isEmpty = false;
    };
    img.src = dataUrl;
  }

  getIsEmpty() {
    return this.isEmpty;
  }
}
