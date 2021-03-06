namespace affine {
    const INPUT_PRIORITY = 10;
    const UPDATE_PRIORITY = 20;
    const DRAW_PRIORITY = 30;
    const GPU_PRIORITY = 90;
    const SCREEN_PRIORITY = 100;

    export class Scene {
        public static SCENE_OFFSET = Screen.SCREEN_HALF_SIZE;
        private static mgr_: SceneManager;
        private xfrm_: Transform;
        private color_: number;

        public get xfrm() { return this.xfrm_; }
        public get color() { return this.color_; }
        public set color(v) { this.color_ = v; }

        private static _staticInit = (() => Scene.mgr_ = new SceneManager())();

        constructor() {
            this.xfrm_ = new Transform();
            this.color_ = 12;
        }

        /* virtual */ update(dt: number) {
        }

        /* virtual */ draw() {
        }

        /* virtual */ startup() {
            // Called when the scene is pushed to the scene manaager.
            // ** Will be called at most one time during the scene's lifetime. **
        }

        /* virtual */ shutdown() {
            // Called when the scene is popped from the scene manager.
            // ** Will be called at most one time during the scene's lifetime. **
        }

        /* virtual */ activate() {
            // Called when the scene becomes the current scene, either by
            // being pushed or the previously current scene popped.
            // ** Can be called multiple times during the scene's lifetime. **
        }

        /* virtual */ deactivate() {
            // Called when the scene is no longer the active scene, either
            // by being popped or a new scene pushed.
            // ** Can be called multiple times during the scene's lifetime. **
        }

        __init() {
            // Hook into the runtime for frame callbacks.
            control.eventContext().registerFrameHandler(INPUT_PRIORITY, () => {
                controller.__update(control.eventContext().deltaTime);
            });
            control.eventContext().registerFrameHandler(UPDATE_PRIORITY, () => {
                this.update(control.eventContext().deltaTime);
            });
            control.eventContext().registerFrameHandler(DRAW_PRIORITY, () => {
                this.draw();
            });
            control.eventContext().registerFrameHandler(GPU_PRIORITY, () => {
                screen.fill(this.color_);
                Gpu.exec();
            });
            control.eventContext().registerFrameHandler(SCREEN_PRIORITY, () => {
                control.__screen.update();
            });
        }

        // SceneManager API

        public static currScene(add = false): Scene { return Scene.mgr_.currScene(add); }
        public static replaceScene(scene: Scene): Scene { return Scene.mgr_.replaceScene(scene); }
        public static pushScene(scene: Scene): Scene { return Scene.mgr_.pushScene(scene); }
        public static popScene(): Scene { return Scene.mgr_.popScene(); }
    }

    class SceneManager {
        private scenes: Scene[];

        constructor() {
            this.scenes = [];
        }

        public currScene(add = false): Scene {
            if (this.scenes.length) {
                return this.scenes[this.scenes.length - 1];
            } else if (add) {
                return this.pushScene(new Scene());
            }
            return undefined;
        }

        public replaceScene(scene: Scene): Scene {
            if (this.scenes.length) {
                this.popScene();
            }
            return this.pushScene(scene);
        }

        public pushScene(scene: Scene): Scene {
            const currScene = this.currScene();
            if (currScene) {
                currScene.deactivate();
            }
            control.pushEventContext();
            this.scenes.push(scene);
            scene.__init();
            scene.startup();
            scene.activate();
            return scene;
        }

        public popScene(): Scene {
            const prevScene = this.scenes.pop();
            if (prevScene) {
                prevScene.deactivate();
                prevScene.shutdown();
                control.popEventContext();
            }
            const currScene = this.currScene();
            if (currScene) {
                currScene.activate();
            }
            return currScene;
        }
    }
}