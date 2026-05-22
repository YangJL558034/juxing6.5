import { notFound } from 'next/navigation';
import { query } from '@/lib/database';

// 强制动态渲染，确保每次都获取最新数据
export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface AssetConfig {
  cpu?: string;
  memory?: string;
  gpu?: string;
  storage?: string;
  monitor?: string;
  system?: string;
  model?: string;
  brand?: string;
  location?: string;
  screen_size?: string;
  resolution?: string;
  serial_number?: string;
  accessories?: string;
  connection_type?: string;
  serial?: string;
  connection?: string;
  os?: string;
  disk?: string;
  capacity?: string;
  install_location?: string;
}

interface Asset {
  id: number;
  type: string;
  name: string;
  department: string;
  user: string;
  value: number;
  purchase_date: string;
  status: string;
  scrap_time: string | null;
  scrap_confirmer: string | null;
  claim_time: string | null;
  config: string | AssetConfig;
  created_at: string;
}

// 生成静态路径
export async function generateStaticParams() {
  return [];
}

export default async function AssetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  let asset: Asset | undefined;
  try {
    asset = query.getAssetById.get(id) as Asset | undefined;
  } catch (error) {
    console.error('Failed to fetch asset:', error);
  }

  if (!asset) {
    notFound();
  }

  // 解析配置
  let config: AssetConfig | null = null;
  if (asset.config) {
    try {
      config = typeof asset.config === 'string' ? JSON.parse(asset.config) : asset.config;
    } catch (e) {
      console.error('Failed to parse config:', e);
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case '使用中':
        return 'bg-green-100 text-green-800 border-green-200';
      case '闲置':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case '维修中':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case '已报废':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case '电脑':
        return '💻';
      case '显示器':
        return '🖥️';
      case '手机':
        return '📱';
      case '路由器':
        return '🌐';
      default:
        return '📦';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-2xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">{getTypeIcon(asset.type)}</div>
          <h1 className="text-2xl font-bold text-slate-800">{asset.name}</h1>
          <p className="text-slate-500 mt-2">{asset.type}</p>
        </div>

        {/* Status Badge */}
        <div className="flex justify-center mb-6">
          <span className={`px-4 py-2 rounded-full text-sm font-medium border ${getStatusColor(asset.status)}`}>
            {asset.status}
          </span>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Basic Info */}
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">基本信息</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-500">资产编号</span>
                <span className="font-medium text-slate-800">#{asset.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">所属部门</span>
                <span className="font-medium text-slate-800">{asset.department || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">使用人</span>
                <span className="font-medium text-slate-800">{asset.user || '-'}</span>
              </div>
              {asset.claim_time && (
                <div className="flex justify-between">
                  <span className="text-slate-500">领用时间</span>
                  <span className="font-medium text-green-600">{asset.claim_time}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-500">资产价值</span>
                <span className="font-medium text-blue-600">¥{(asset.value || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">购买日期</span>
                <span className="font-medium text-slate-800">{asset.purchase_date || '-'}</span>
              </div>
            </div>
          </div>

          {/* 报废信息 */}
          {asset.status === '已报废' && asset.scrap_time && (
            <div className="p-6 border-b border-slate-100 bg-red-50">
              <h2 className="text-lg font-semibold text-red-800 mb-4 flex items-center gap-2">
                <span>⚠️</span> 资产已报废
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-red-600">报废认定时间</span>
                  <span className="font-medium text-red-800">{asset.scrap_time}</span>
                </div>
                {asset.scrap_confirmer && (
                  <div className="flex justify-between">
                    <span className="text-red-600">报废确认人</span>
                    <span className="font-medium text-red-800">{asset.scrap_confirmer}</span>
                  </div>
                )}
                <p className="text-sm text-red-600 mt-2">
                  该资产已被认定报废，请勿继续使用。
                </p>
              </div>
            </div>
          )}

          {/* Config Info (for computer type) */}
          {config && asset.type === '电脑' && (
            <div className="p-6 border-b border-slate-100 bg-slate-50">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">💻 电脑配置</h2>
              <div className="space-y-3">
                {config.cpu && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">CPU</span>
                    <span className="font-medium text-slate-800">{config.cpu}</span>
                  </div>
                )}
                {config.memory && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">内存</span>
                    <span className="font-medium text-slate-800">{config.memory}</span>
                  </div>
                )}
                {config.gpu && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">显卡</span>
                    <span className="font-medium text-slate-800">{config.gpu}</span>
                  </div>
                )}
                {config.storage && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">存储</span>
                    <span className="font-medium text-slate-800">{config.storage}</span>
                  </div>
                )}
                {config.system && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">操作系统</span>
                    <span className="font-medium text-slate-800">{config.system}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Other type configs */}
          {config && asset.type === '显示器' && (
            <div className="p-6 border-b border-slate-100 bg-slate-50">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">🖥️ 显示器参数</h2>
              <div className="space-y-3">
                {config.monitor && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">尺寸/分辨率</span>
                    <span className="font-medium text-slate-800">{config.monitor}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {config && asset.type === '手机' && (
            <div className="p-6 border-b border-slate-100 bg-slate-50">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">📱 手机配置</h2>
              <div className="space-y-3">
                {config.memory && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">存储容量</span>
                    <span className="font-medium text-slate-800">{config.memory}</span>
                  </div>
                )}
                {config.system && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">系统版本</span>
                    <span className="font-medium text-slate-800">{config.system}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {config && asset.type === '路由器' && (
            <div className="p-6 border-b border-slate-100 bg-slate-50">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">🌐 路由器参数</h2>
              <div className="space-y-3">
                {config.system && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">型号/规格</span>
                    <span className="font-medium text-slate-800">{config.system}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 笔记本电脑 */}
          {config && asset.type === '笔记本电脑' && (
            <div className="p-6 border-b border-slate-100 bg-slate-50">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">💻 笔记本电脑配置</h2>
              <div className="space-y-3">
                {config.cpu && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">CPU</span>
                    <span className="font-medium text-slate-800">{config.cpu}</span>
                  </div>
                )}
                {config.memory && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">内存</span>
                    <span className="font-medium text-slate-800">{config.memory}</span>
                  </div>
                )}
                {config.storage && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">硬盘</span>
                    <span className="font-medium text-slate-800">{config.storage}</span>
                  </div>
                )}
                {config.monitor && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">屏幕尺寸</span>
                    <span className="font-medium text-slate-800">{config.monitor}</span>
                  </div>
                )}
                {config.system && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">操作系统</span>
                    <span className="font-medium text-slate-800">{config.system}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 苹果平板电脑 */}
          {config && asset.type === '苹果平板电脑' && (
            <div className="p-6 border-b border-slate-100 bg-slate-50">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">📱 苹果平板电脑配置</h2>
              <div className="space-y-3">
                {config.model && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">型号</span>
                    <span className="font-medium text-slate-800">{config.model}</span>
                  </div>
                )}
                {config.memory && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">存储容量</span>
                    <span className="font-medium text-slate-800">{config.memory}</span>
                  </div>
                )}
                {config.serial && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">序列号</span>
                    <span className="font-medium text-slate-800">{config.serial}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 安卓平板电脑 */}
          {config && asset.type === '安卓平板电脑' && (
            <div className="p-6 border-b border-slate-100 bg-slate-50">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">📱 安卓平板电脑配置</h2>
              <div className="space-y-3">
                {config.model && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">型号</span>
                    <span className="font-medium text-slate-800">{config.model}</span>
                  </div>
                )}
                {config.memory && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">存储容量</span>
                    <span className="font-medium text-slate-800">{config.memory}</span>
                  </div>
                )}
                {config.monitor && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">屏幕尺寸</span>
                    <span className="font-medium text-slate-800">{config.monitor}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 安卓生产看板 */}
          {config && asset.type === '安卓生产看板' && (
            <div className="p-6 border-b border-slate-100 bg-slate-50">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">📺 安卓生产看板配置</h2>
              <div className="space-y-3">
                {config.model && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">型号</span>
                    <span className="font-medium text-slate-800">{config.model}</span>
                  </div>
                )}
                {config.monitor && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">屏幕尺寸</span>
                    <span className="font-medium text-slate-800">{config.monitor}</span>
                  </div>
                )}
                {config.location && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">安装位置</span>
                    <span className="font-medium text-slate-800">{config.location}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 电视机 */}
          {config && asset.type === '电视机' && (
            <div className="p-6 border-b border-slate-100 bg-slate-50">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">📺 电视机配置</h2>
              <div className="space-y-3">
                {config.model && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">型号</span>
                    <span className="font-medium text-slate-800">{config.model}</span>
                  </div>
                )}
                {config.monitor && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">屏幕尺寸</span>
                    <span className="font-medium text-slate-800">{config.monitor}</span>
                  </div>
                )}
                {config.resolution && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">分辨率</span>
                    <span className="font-medium text-slate-800">{config.resolution}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 大疆设备 */}
          {config && asset.type === '大疆设备' && (
            <div className="p-6 border-b border-slate-100 bg-slate-50">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">🚁 大疆设备配置</h2>
              <div className="space-y-3">
                {config.model && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">设备型号</span>
                    <span className="font-medium text-slate-800">{config.model}</span>
                  </div>
                )}
                {config.serial && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">序列号</span>
                    <span className="font-medium text-slate-800">{config.serial}</span>
                  </div>
                )}
                {config.accessories && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">配件</span>
                    <span className="font-medium text-slate-800">{config.accessories}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 扫码枪 */}
          {config && asset.type === '扫码枪' && (
            <div className="p-6 border-b border-slate-100 bg-slate-50">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">🔫 扫码枪配置</h2>
              <div className="space-y-3">
                {config.model && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">型号</span>
                    <span className="font-medium text-slate-800">{config.model}</span>
                  </div>
                )}
                {config.connection && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">连接方式</span>
                    <span className="font-medium text-slate-800">{config.connection}</span>
                  </div>
                )}
                {config.serial && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">序列号</span>
                    <span className="font-medium text-slate-800">{config.serial}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 空调遥控器 */}
          {config && asset.type === '空调遥控器' && (
            <div className="p-6 border-b border-slate-100 bg-slate-50">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">遥控器配置</h2>
              <div className="space-y-3">
                {config.model && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">型号</span>
                    <span className="font-medium text-slate-800">{config.model}</span>
                  </div>
                )}
                {config.brand && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">适配品牌</span>
                    <span className="font-medium text-slate-800">{config.brand}</span>
                  </div>
                )}
                {config.location && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">使用位置</span>
                    <span className="font-medium text-slate-800">{config.location}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="p-4 bg-slate-50 text-center text-sm text-slate-400">
            聚星数据平台 · 资产管理
          </div>
        </div>
      </div>
    </div>
  );
}
