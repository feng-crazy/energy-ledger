#!/bin/bash

###############################################################################
# Energy Ledger - 本地构建 APK 脚本
# 适用于 macOS 环境
# 
# 使用方法:
#   chmod +x build-local-apk.sh
#   ./build-local-apk.sh [选项]
#
# 选项:
#   --release    构建 release 版本（默认为 debug）
#   --clean      清理之前的构建文件
#   --help       显示帮助信息
###############################################################################

set -e  # 遇到错误立即退出

# ======================= 配置区域 =======================

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 项目配置
PROJECT_NAME="energy-ledger"
PACKAGE_NAME="com.hedengfeng.energyledger"
BUILD_TYPE="debug"  # 默认 debug 版本

# ======================= 环境变量设置 =======================

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   Energy Ledger 本地 APK 构建脚本${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 解析命令行参数
while [[ $# -gt 0 ]]; do
    case $1 in
        --release)
            BUILD_TYPE="release"
            shift
            ;;
        --clean)
            CLEAN_BUILD=true
            shift
            ;;
        --help)
            echo "使用方法: $0 [选项]"
            echo ""
            echo "选项:"
            echo "  --release    构建 release 版本（默认为 debug）"
            echo "  --clean      清理之前的构建文件"
            echo "  --help       显示帮助信息"
            exit 0
            ;;
        *)
            echo -e "${RED}错误: 未知选项 $1${NC}"
            exit 1
            ;;
    esac
done

echo -e "${YELLOW}[1/6] 检查并设置环境变量...${NC}"

# ----- Java 环境设置 -----
# 检查 JAVA_HOME 是否已设置
if [ -z "$JAVA_HOME" ]; then
    echo -e "${YELLOW}JAVA_HOME 未设置，正在尝试自动检测...${NC}"
    
    # 尝试常见路径
    JAVA_PATHS=(
        "/Library/Java/JavaVirtualMachines/jdk-17.jdk/Contents/Home"
        "/Library/Java/JavaVirtualMachines/jdk-17.0.1.jdk/Contents/Home"
        "/Library/Java/JavaVirtualMachines/jdk-17.0.2.jdk/Contents/Home"
        "/Library/Java/JavaVirtualMachines/jdk-17.0.3.jdk/Contents/Home"
        "/Library/Java/JavaVirtualMachines/jdk-17.0.4.jdk/Contents/Home"
        "/Library/Java/JavaVirtualMachines/jdk-17.0.5.jdk/Contents/Home"
        "/Library/Java/JavaVirtualMachines/jdk-17.0.6.jdk/Contents/Home"
        "/Library/Java/JavaVirtualMachines/jdk-17.0.7.jdk/Contents/Home"
        "/Library/Java/JavaVirtualMachines/jdk-17.0.8.jdk/Contents/Home"
        "/Library/Java/JavaVirtualMachines/jdk-17.0.9.jdk/Contents/Home"
        "/Library/Java/JavaVirtualMachines/jdk-17.0.10.jdk/Contents/Home"
        "/Library/Java/JavaVirtualMachines/jdk-17.0.11.jdk/Contents/Home"
        "/Library/Java/JavaVirtualMachines/jdk-17.0.12.jdk/Contents/Home"
        "/Library/Java/JavaVirtualMachines/temurin-17.jdk/Contents/Home"
        "/Library/Java/JavaVirtualMachines/zulu-17.jdk/Contents/Home"
    )
    
    for path in "${JAVA_PATHS[@]}"; do
        if [ -d "$path" ]; then
            export JAVA_HOME="$path"
            echo -e "${GREEN}✓ 检测到 Java: $JAVA_HOME${NC}"
            break
        fi
    done
    
    if [ -z "$JAVA_HOME" ]; then
        echo -e "${RED}✗ 未找到 JDK 17，请手动设置 JAVA_HOME${NC}"
        echo -e "${YELLOW}提示: 请安装 JDK 17 或设置 JAVA_HOME 环境变量${NC}"
        echo -e "${YELLOW}示例: export JAVA_HOME=/Library/Java/JavaVirtualMachines/jdk-17.jdk/Contents/Home${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✓ JAVA_HOME 已设置: $JAVA_HOME${NC}"
fi

# 验证 Java 版本
JAVA_VERSION=$("$JAVA_HOME/bin/java" -version 2>&1 | head -n 1 | cut -d'"' -f2 | cut -d'.' -f1)
if [ "$JAVA_VERSION" -lt 17 ]; then
    echo -e "${RED}✗ Java 版本过低: $JAVA_VERSION，需要 JDK 17 或更高版本${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Java 版本: $(java -version 2>&1 | head -n 1)${NC}"

# ----- Android SDK 环境设置 -----
# 检查 ANDROID_HOME 是否已设置
if [ -z "$ANDROID_HOME" ]; then
    echo -e "${YELLOW}ANDROID_HOME 未设置，正在尝试自动检测...${NC}"
    
    # 尝试常见路径
    ANDROID_PATHS=(
        "$HOME/Library/Android/sdk"
        "$HOME/Android/Sdk"
        "/usr/local/share/android-sdk"
        "/opt/android-sdk"
        "$HOME/.android/sdk"
    )
    
    for path in "${ANDROID_PATHS[@]}"; do
        if [ -d "$path" ]; then
            export ANDROID_HOME="$path"
            echo -e "${GREEN}✓ 检测到 Android SDK: $ANDROID_HOME${NC}"
            break
        fi
    done
    
    if [ -z "$ANDROID_HOME" ]; then
        echo -e "${RED}✗ 未找到 Android SDK，请手动设置 ANDROID_HOME${NC}"
        echo -e "${YELLOW}提示: 请安装 Android Studio 或 Android SDK，并设置 ANDROID_HOME${NC}"
        echo -e "${YELLOW}示例: export ANDROID_HOME=\$HOME/Library/Android/sdk${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✓ ANDROID_HOME 已设置: $ANDROID_HOME${NC}"
fi

# 添加 Android SDK 工具到 PATH
export PATH="$ANDROID_HOME/emulator:$PATH"
export PATH="$ANDROID_HOME/platform-tools:$PATH"
export PATH="$ANDROID_HOME/cmdline-tools/latest/bin:$PATH"
export PATH="$ANDROID_HOME/tools:$PATH"
export PATH="$ANDROID_HOME/tools/bin:$PATH"

# 验证 Android SDK 工具
if [ ! -d "$ANDROID_HOME/platforms" ]; then
    echo -e "${RED}✗ 未找到 Android SDK platforms 目录${NC}"
    echo -e "${YELLOW}提示: 请通过 Android Studio SDK Manager 安装 SDK 平台${NC}"
    exit 1
fi

# 检查必要的 SDK 组件
REQUIRED_COMPONENTS=(
    "build-tools"
    "platform-tools"
)

for component in "${REQUIRED_COMPONENTS[@]}"; do
    if [ ! -d "$ANDROID_HOME/$component" ]; then
        echo -e "${RED}✗ 未找到 Android SDK $component${NC}"
        echo -e "${YELLOW}提示: 请通过 Android Studio SDK Manager 安装 $component${NC}"
        exit 1
    fi
done

echo -e "${GREEN}✓ Android SDK 环境检查通过${NC}"

# ======================= 构建流程 =======================

# 获取脚本所在目录的父目录（项目根目录）
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo -e "${YELLOW}[2/6] 检查项目依赖...${NC}"

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ 未安装 Node.js${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js 版本: $(node -v)${NC}"

# 检查 npm 或 yarn
if command -v npm &> /dev/null; then
    echo -e "${GREEN}✓ npm 版本: $(npm -v)${NC}"
    PACKAGE_MANAGER="npm"
elif command -v yarn &> /dev/null; then
    echo -e "${GREEN}✓ yarn 版本: $(yarn -v)${NC}"
    PACKAGE_MANAGER="yarn"
else
    echo -e "${RED}✗ 未找到 npm 或 yarn${NC}"
    exit 1
fi

# 安装依赖
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}安装项目依赖...${NC}"
    $PACKAGE_MANAGER install
fi

echo -e "${YELLOW}[3/6] 清理之前的构建文件...${NC}"

# 清理构建文件
if [ "$CLEAN_BUILD" = true ] || [ "$1" = "--clean" ]; then
    echo -e "${YELLOW}清理 android 目录和构建缓存...${NC}"
    rm -rf android
    rm -rf .expo
    rm -rf node_modules/.cache
    npx expo-cli start --clear 2>/dev/null || true
fi

echo -e "${YELLOW}[4/6] 执行 Expo Prebuild...${NC}"

# 执行 prebuild（生成原生代码）
npx expo prebuild --platform android --clean

if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Prebuild 失败${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Prebuild 完成${NC}"

echo -e "${YELLOW}[5/6] 构建 APK...${NC}"

# 进入 android 目录
cd android

# 赋予 gradlew 执行权限
chmod +x gradlew

# 构建 APK
echo -e "${BLUE}构建类型: $BUILD_TYPE${NC}"

if [ "$BUILD_TYPE" = "release" ]; then
    echo -e "${YELLOW}构建 Release APK...${NC}"
    ./gradlew assembleRelease
    
    APK_PATH="app/build/outputs/apk/release/app-release.apk"
    OUTPUT_NAME="${PROJECT_NAME}-release-$(date +%Y%m%d-%H%M%S).apk"
else
    echo -e "${YELLOW}构建 Debug APK...${NC}"
    ./gradlew assembleDebug
    
    APK_PATH="app/build/outputs/apk/debug/app-debug.apk"
    OUTPUT_NAME="${PROJECT_NAME}-debug-$(date +%Y%m%d-%H%M%S).apk"
fi

if [ $? -ne 0 ]; then
    echo -e "${RED}✗ APK 构建失败${NC}"
    exit 1
fi

echo -e "${GREEN}✓ APK 构建成功${NC}"

# ======================= 输出结果 =======================

echo -e "${YELLOW}[6/6] 整理输出文件...${NC}"

# 返回项目根目录
cd ..

# 创建输出目录
OUTPUT_DIR="./build-output"
mkdir -p "$OUTPUT_DIR"

# 复制 APK 到输出目录
cp "android/$APK_PATH" "$OUTPUT_DIR/$OUTPUT_NAME"

# 获取 APK 文件大小
APK_SIZE=$(du -h "$OUTPUT_DIR/$OUTPUT_NAME" | cut -f1)

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}   构建成功！${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}构建信息:${NC}"
echo -e "  项目名称: ${PROJECT_NAME}"
echo -e "  包名: ${PACKAGE_NAME}"
echo -e "  构建类型: ${BUILD_TYPE}"
echo -e "  构建时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""
echo -e "${BLUE}输出文件:${NC}"
echo -e "  路径: ${OUTPUT_DIR}/${OUTPUT_NAME}"
echo -e "  大小: ${APK_SIZE}"
echo ""
echo -e "${YELLOW}提示:${NC}"
echo -e "  - 可以使用 adb install 命令安装到设备"
echo -e "  - Release 版本需要签名才能发布"
echo -e "  - 首次构建可能需要下载依赖，请耐心等待"
echo ""

# ======================= 可选：安装到设备 =======================

# 检查是否有连接的设备
if command -v adb &> /dev/null; then
    DEVICE_COUNT=$(adb devices | grep -v "List" | grep -c "device$")
    if [ "$DEVICE_COUNT" -gt 0 ]; then
        echo -e "${YELLOW}检测到 $DEVICE_COUNT 个已连接的 Android 设备${NC}"
        read -p "是否立即安装到设备？(y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            adb install -r "$OUTPUT_DIR/$OUTPUT_NAME"
            echo -e "${GREEN}✓ 安装完成${NC}"
        fi
    fi
fi

echo -e "${GREEN}构建脚本执行完毕！${NC}"