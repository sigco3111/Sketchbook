import { ISpawnPoint } from '../interfaces/ISpawnPoint';
import { VehicleSpawnPoint } from './VehicleSpawnPoint';
import { CharacterSpawnPoint } from './CharacterSpawnPoint';
import { World } from '../world/World';
import { LoadingManager } from '../core/LoadingManager';

export class Scenario
{
	public id: string;
	public name: string;
	public spawnAlways: boolean = false;
	public default: boolean = false;
	public world: World;
	public descriptionTitle: string;
	public descriptionContent: string;
	
	private rootNode: THREE.Object3D;
	private spawnPoints: ISpawnPoint[] = [];
	private invisible: boolean = false;
	private initialCameraAngle: number;

	constructor(root: THREE.Object3D, world: World)
	{
		const ko: {[key: string]: string} = {"Oval race": "타원형 트랙 경주", "Tunnel race": "터널 경주", "Figure 8 race": "8자 트랙 경주", "Loop ramp": "루프 경사로", "Mega ramp": "초대형 경사로", "Free roam (default)": "자유 탐험 (기본)", "Default spawn": "자유 탐험", "Free roam (aviation)": "자유 탐험 (항공)", "Aviation spawn": "항공기 체험", "Explore the world!": "세계를 자유롭게 탐험해 보세요!", "Try out Sketchbook's custom airplane and helicopter physics.": "Sketchbook의 비행기와 헬리콥터 물리를 체험해 보세요.", "Race around the oval against opponents. There's no lap or position tracking yet, so just enjoy the ride for now. :)": "상대 차량과 타원형 트랙을 달립니다. 아직 랩 수와 순위 기록은 없으니 주행을 즐겨 주세요. :)", "Race through the tunnels against opponents. Turn around when you reach either of the Spomenik monuments. There's no lap or position tracking yet, so just enjoy the ride for now. :)": "상대 차량과 터널을 달립니다. 양끝의 스포메니크 기념물에 도착하면 돌아오세요. 아직 랩 수와 순위 기록은 없습니다. :)", "Race around the track against opponents. There's no lap or position tracking yet, so just enjoy the ride for now. :)": "상대 차량과 트랙을 달립니다. 아직 랩 수와 순위 기록은 없으니 주행을 즐겨 주세요. :)", "Make it around the loop and climb up the other side. Try letting off the gas pedal when you drive down the ramp, as the car won't get limited by the engine's maximum RPM.": "루프를 돌아 반대편으로 올라가 보세요. 경사로를 내려갈 때 가속 키를 놓으면 엔진 최고 회전수에 속도가 제한되지 않습니다.", "Drive down the mega ramp! Can you make it down in one piece?": "초대형 경사로를 내려가세요! 무사히 도착할 수 있을까요?"};
		for (const key of ['name', 'desc_title', 'desc_content']) { if (ko[root.userData[key]]) root.userData[key] = ko[root.userData[key]]; }
		this.rootNode = root;
		this.world = world;
		this.id = root.name;

		// Scenario
		if (root.userData.hasOwnProperty('name')) 
		{
			this.name = root.userData.name;
		}
		if (root.userData.hasOwnProperty('default') && root.userData.default === 'true') 
		{
			this.default = true;
		}
		if (root.userData.hasOwnProperty('spawn_always') && root.userData.spawn_always === 'true') 
		{
			this.spawnAlways = true;
		}
		if (root.userData.hasOwnProperty('invisible') && root.userData.invisible === 'true') 
		{
			this.invisible = true;
		}
		if (root.userData.hasOwnProperty('desc_title')) 
		{
			this.descriptionTitle = root.userData.desc_title;
		}
		if (root.userData.hasOwnProperty('desc_content')) 
		{
			this.descriptionContent = root.userData.desc_content;
		}
		if (root.userData.hasOwnProperty('camera_angle')) 
		{
			this.initialCameraAngle = root.userData.camera_angle;
		}

		if (!this.invisible) this.createLaunchLink();

		// Find all scenario spawns and enitites
		root.traverse((child) => {
			if (child.hasOwnProperty('userData') && child.userData.hasOwnProperty('data'))
			{
				if (child.userData.data === 'spawn')
				{
					if (child.userData.type === 'car' || child.userData.type === 'airplane' || child.userData.type === 'heli')
					{
						let sp = new VehicleSpawnPoint(child);

						if (child.userData.hasOwnProperty('type')) 
						{
							sp.type = child.userData.type;
						}

						if (child.userData.hasOwnProperty('driver')) 
						{
							sp.driver = child.userData.driver;

							if (child.userData.driver === 'ai' && child.userData.hasOwnProperty('first_node'))
							{
								sp.firstAINode = child.userData.first_node;
							}
						}

						this.spawnPoints.push(sp);
					}
					else if (child.userData.type === 'player')
					{
						let sp = new CharacterSpawnPoint(child);
						this.spawnPoints.push(sp);
					}
				}
			}
		});
	}

	public createLaunchLink(): void
	{
		this.world.params[this.name] = () =>
		{
			this.world.launchScenario(this.id);
		};
		this.world.scenarioGUIFolder.add(this.world.params, this.name);
	}

	public launch(loadingManager: LoadingManager, world: World): void
	{
		this.spawnPoints.forEach((sp) => {
			sp.spawn(loadingManager, world);
		});

		if (!this.spawnAlways)
		{
			loadingManager.createWelcomeScreenCallback(this);

			world.cameraOperator.theta = this.initialCameraAngle;
			world.cameraOperator.phi = 15;
		}
	}
}