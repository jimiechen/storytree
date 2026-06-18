import type { WorldSetting } from '../types/world'

export const mockWorldSetting: WorldSetting = {
  projectId: 'proj-001',
  overview: {
    background: '斗气大陆，一个以斗气修炼为主的世界。大陆分为诸多帝国与宗门，强者可移山填海，弱者如蝼蚁。千年之前，斗帝强者纷纷消失，留下无数传说与遗迹。',
    powerSystem: '斗之气 → 斗者 → 斗师 → 大斗师 → 斗灵 → 斗王 → 斗皇 → 斗宗 → 斗尊 → 斗圣 → 斗帝。每级分九星，修炼斗气功法可加速提升。异火为天地所生，威力无穷。',
    socialStructure: '以实力为尊的等级社会。帝国统治凡人城池，宗门掌控修炼资源。炼药师地位超然，一张丹方可换一座城池。拍卖会、佣兵团、杀手组织渗透各方。',
    specialRules: '灵魂力量可感知异火与宝物。空间之力达斗宗方可掌握。远古种族拥有血脉传承。陀舍古帝洞府藏有成帝之秘。'
  },
  locations: [
    { id: 'loc-001', name: '乌坦城', tags: ['城镇', '萧家', '起点'], description: '加玛帝国边陲小城，萧家所在。萧炎从这里踏上强者之路，也是与纳兰嫣然定下三年之约的起点。' },
    { id: 'loc-002', name: '魔兽山脉', tags: ['秘境', '危险', '历练'], description: '横跨数大帝国的险峻山脉，栖息着无数魔兽。深处有异火出没，是佣兵与冒险者的历练圣地。' },
    { id: 'loc-003', name: '迦南学院', tags: ['学院', '中立', '天焚炼气塔'], description: '斗气大陆最负盛名的修炼学院，拥有加速修炼的天焚炼气塔。汇聚各方天才，中立地位不受帝国与宗门干涉。' }
  ],
  items: [
    { id: 'item-001', name: '青莲地心火', type: 'fire', tags: ['异火', '天地所生', '排名19'], description: '异火榜排名第十九，生于大地深处。十年成灵，百年成形，千年成莲。可焚尽万物，炼药师得之如虎添翼。' },
    { id: 'item-002', name: '玄重尺', type: 'weapon', tags: ['武器', '漆黑', '沉重'], description: '萧炎的标志性武器，漆黑巨尺，极为沉重。背负修炼可压制斗气，取下后实力暴涨。' }
  ],
  skills: [
    { id: 'skill-001', name: '焚诀', type: 'technique', level: '可进化', description: '药老传授的神秘功法，可通过吞噬异火不断进化。初为黄阶低级，传说可进化为天阶。' },
    { id: 'skill-002', name: '八极崩', type: 'combat', level: '玄阶高级', description: '近身斗技，以刚猛著称。练至大成可爆发出八重暗劲，叠加之下威力惊人。' }
  ],
  factions: [
    { id: 'fac-001', name: '萧家', type: 'family', description: '乌坦城三大家族之一，曾经的远古八族之一萧族后裔。因血脉枯竭而衰落，但族纹之力仍可觉醒。', influence: 'medium' },
    { id: 'fac-002', name: '加玛帝国', type: 'empire', description: '斗气大陆西北域的强大帝国，皇室拥有斗皇强者坐镇。与云岚宗关系微妙，相互制衡。', influence: 'high' },
    { id: 'fac-003', name: '云岚宗', type: 'sect', description: '加玛帝国最强宗门，宗主云韵为斗皇强者。少宗主纳兰嫣然与萧炎的三年之约震动帝国。', influence: 'high' }
  ]
}
