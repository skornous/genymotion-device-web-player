'use strict';

/**
 * Instance mouse plugin.
 * Forward touch events to instance.
 */
module.exports = class MouseEvents {
    /**
     * Plugin initialization.
     *
     * @param {Object} instance Associated instance.
     */
    constructor(instance) {
        // Reference instance
        this.instance = instance;

        // Register plugin
        this.instance.mouseEvents = this;
        this.instance.mouseEventsEnabled = true;

        this.leftButtonPressed = false;
        this.boundEventListener = this.releaseAtPreviousPositionEvent.bind(this);
        this.removeMouseUpListener = () => {};
    }

    /**
     * Mouse press event handler.
     *
     * @param {Event} event Event.
     */
    onMousePressEvent(event) {
        /**
         * At launch the sound is muted until a click is performed on the <video>
         * `this.instance.mediaManager.isMuted` is necessary to force the sound to be muted even if the user clicked on the video
         */
        this.instance.video.muted = !this.instance.mediaManager.isMuted ? this.instance.video.muted : false;
        if (event.button !== 0) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();
        this.leftButtonPressed = true;
        this.instance.x = this.instance.coordinateUtils.getXCoordinate(event);
        this.instance.y = this.instance.coordinateUtils.getYCoordinate(event);

        let json = '';
        if (event.ctrlKey || event.metaKey) {
            json = {
                type: 'FAKE_MULTI_TOUCH_PRESS',
                mode: event.shiftKey ? 2 : 1,
                x: this.instance.x,
                y: this.instance.y,
            };
        } else {
            json = {type: 'MOUSE_PRESS', x: this.instance.x, y: this.instance.y};
        }
        this.instance.sendEvent(json);

        this.removeMouseUpListener = this.instance.addListener(document, 'mouseup', this.boundEventListener, false);
    }

    /**
     * Mouse release event handler.
     *
     * @param {Event} event Event.
     */
    onMouseReleaseEvent(event) {
        if (event.button !== 0) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();
        this.leftButtonPressed = false;
        this.instance.x = this.instance.coordinateUtils.getXCoordinate(event);
        this.instance.y = this.instance.coordinateUtils.getYCoordinate(event);
        let json = '';
        if (event.ctrlKey || event.metaKey) {
            json = {
                type: 'FAKE_MULTI_TOUCH_RELEASE',
                mode: event.shiftKey ? 2 : 1,
                x: this.instance.x,
                y: this.instance.y,
            };
        } else {
            json = {type: 'MOUSE_RELEASE', x: this.instance.x, y: this.instance.y};
        }
        this.instance.sendEvent(json);

        this.removeMouseUpListener();
    }

    /**
     * External mouse release event classback.
     * Called when onmouseup event occurs outside of the renderer.
     *
     * @param {Event} event Event.
     */
    releaseAtPreviousPositionEvent(event) {
        if (event.button !== 0) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();
        this.leftButtonPressed = false;
        const json = {
            type: event.ctrlKey || event.metaKey ? 'FAKE_MULTI_TOUCH_RELEASE' : 'MOUSE_RELEASE',
            x: this.instance.x,
            y: this.instance.y,
        };
        this.instance.sendEvent(json);

        this.removeMouseUpListener();
    }

    /**
     * Mouse move event handler.
     *
     * @param {Event} event Event.
     */
    onMouseMoveEvent(event) {
        if (!this.leftButtonPressed) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();
        this.instance.x = this.instance.coordinateUtils.getXCoordinate(event);
        this.instance.y = this.instance.coordinateUtils.getYCoordinate(event);
        const json = {type: 'MOUSE_MOVE', x: this.instance.x, y: this.instance.y};
        this.instance.sendEvent(json);
    }

    /**
     * Mouse move event handler.
     *
     * @param {Event} event Event.
     */
    onMouseWheelEvent(event) {
        event.preventDefault();
        event.stopPropagation();
        this.instance.x = this.instance.coordinateUtils.getXCoordinate(event);
        this.instance.y = this.instance.coordinateUtils.getYCoordinate(event);
        const delta = this.getWheelDeltaPixels(event.deltaY, event.deltaMode);
        const json = {type: 'WHEEL', x: this.instance.x, y: this.instance.y, delta: delta};
        this.instance.sendEvent(json);
    }

    /**
     * Method called when context menu try to open.
     *
     * @param {Event} event Event.
     */
    cancelContextMenu(event) {
        event.preventDefault();
        event.stopPropagation();
        event.returnValue = false;
    }

    /**
     * Bind all event handlers to the video wrapper.
     */
    addMouseCallbacks() {
        this.instance.addListener(this.instance.videoWrapper, 'mousedown', this.onMousePressEvent.bind(this), false);
        this.instance.addListener(this.instance.videoWrapper, 'mouseup', this.onMouseReleaseEvent.bind(this), false);
        this.instance.addListener(this.instance.videoWrapper, 'mousemove', this.onMouseMoveEvent.bind(this), false);
        this.instance.addListener(this.instance.videoWrapper, 'wheel', this.onMouseWheelEvent.bind(this), {
            passive: false,
        });
        this.instance.addListener(this.instance.videoWrapper, 'contextmenu', this.cancelContextMenu.bind(this), false);
    }

    getWheelDeltaPixels(delta, mode) {
        // Reasonable defaults
        const PIXEL_STEP = 1;
        const LINE_HEIGHT = 40;
        const PAGE_HEIGHT = 800;

        let pixels = delta * PIXEL_STEP;

        if (pixels && mode) {
            if (mode === 1) {
                // delta in LINE units
                pixels *= LINE_HEIGHT;
            } else {
                // delta in PAGE units
                pixels *= PAGE_HEIGHT;
            }
        }

        return pixels;
    }
};
