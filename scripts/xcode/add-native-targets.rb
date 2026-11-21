# Keeps the app target's sources in step with the files under macos/DevUtility-macOS/ and adds the
# DevUtilityNativeTests unit test target. Safe to re-run.
# Run from the repo root: npm run xcode:add-native-targets
require 'xcodeproj'

MACOS_DIR = File.expand_path('../../macos', __dir__)
PROJECT_PATH = File.join(MACOS_DIR, 'DevUtility.xcodeproj')
APP_TARGET_NAME = 'DevUtility-macOS'
APP_SOURCE_DIR = File.join(MACOS_DIR, APP_TARGET_NAME)
TEST_TARGET_NAME = 'DevUtilityNativeTests'
TEST_SOURCE_DIR = File.join(MACOS_DIR, TEST_TARGET_NAME)
COMPILED_EXTENSIONS = %w[.swift .m .mm].freeze

# Pure logic the unit tests compile directly, so the test bundle needs no host app and no
# React Native build. These files may only import Foundation or AppKit.
PURE_APP_SOURCES = %w[
  Tools/ToolDefinition.swift
  Tools/ToolRegistry.swift
  Panels/PanelFrameCalculator.swift
  Panels/OutsideClickRule.swift
  Settings/ShortcutConflictResolver.swift
].freeze

def compiled_files_under(directory)
  Dir[File.join(directory, '**', '*')].select { |path| COMPILED_EXTENSIONS.include?(File.extname(path)) }.sort
end

# Finds or creates the group for `path`, mirroring its folders below `root_group`'s directory.
def group_for(root_group, root_dir, path)
  relative_dir = File.dirname(path).delete_prefix(root_dir).delete_prefix('/')
  return root_group if relative_dir.empty?

  relative_dir.split('/').reduce(root_group) do |parent, folder|
    parent.children.find { |child| child.isa == 'PBXGroup' && child.path == folder } ||
      parent.new_group(folder, folder)
  end
end

def reference_for(project, root_group, root_dir, path)
  project.files.find { |reference| reference.real_path.to_s == path } ||
    group_for(root_group, root_dir, path).new_reference(File.basename(path))
end

# Drops build files and references whose file no longer exists (moved or deleted), then adds the
# ones that are missing.
def sync_sources(project, target, root_group, root_dir, paths)
  target.source_build_phase.files.dup.each do |build_file|
    reference = build_file.file_ref
    next if reference.nil? || File.exist?(reference.real_path.to_s)

    build_file.remove_from_project
    reference.remove_from_project
  end

  compiled = target.source_build_phase.files_references.compact.map { |reference| reference.real_path.to_s }
  paths.each do |path|
    next if compiled.include?(path)

    target.add_file_references([reference_for(project, root_group, root_dir, path)])
  end
end

def remove_empty_groups(group)
  group.groups.each { |child| remove_empty_groups(child) }
  group.remove_from_project if group.children.empty? && group.parent.is_a?(Xcodeproj::Project::Object::PBXGroup)
end

project = Xcodeproj::Project.open(PROJECT_PATH)
app_target = project.targets.find { |target| target.name == APP_TARGET_NAME }
app_group = project.main_group[APP_TARGET_NAME]

sync_sources(project, app_target, app_group, APP_SOURCE_DIR, compiled_files_under(APP_SOURCE_DIR))

test_target = project.targets.find { |target| target.name == TEST_TARGET_NAME }
unless test_target
  test_target = project.new_target(:unit_test_bundle, TEST_TARGET_NAME, :osx, '14.0')
  project.main_group.find_subpath(TEST_TARGET_NAME, true).set_path(TEST_TARGET_NAME)
  # new_target links Cocoa through a path inside one SDK version, which dangles on any other
  # Xcode; Swift links it from `import` anyway (same fix as add-e2e-targets.rb).
  test_target.frameworks_build_phase.files.select { |file| file.display_name == 'Cocoa.framework' }.each do |file|
    reference = file.file_ref
    file.remove_from_project
    reference.remove_from_project if reference && reference.build_files.empty?
  end
end
test_target.build_configurations.each do |configuration|
  settings = configuration.build_settings
  settings['PRODUCT_NAME'] = '$(TARGET_NAME)'
  settings['GENERATE_INFOPLIST_FILE'] = 'YES'
  settings['PRODUCT_BUNDLE_IDENTIFIER'] = 'org.reactjs.native.DevUtilityNativeTests'
  settings['SWIFT_VERSION'] = '5.0'
  settings['CODE_SIGN_IDENTITY'] = '-'
  settings['CODE_SIGN_STYLE'] = 'Manual'
  settings['MACOSX_DEPLOYMENT_TARGET'] = '14.0'
end

test_group = project.main_group[TEST_TARGET_NAME]
pure_sources = PURE_APP_SOURCES.map { |relative| File.join(APP_SOURCE_DIR, relative) }.select { |path| File.exist?(path) }
test_paths = compiled_files_under(TEST_SOURCE_DIR)
sync_sources(project, test_target, test_group, TEST_SOURCE_DIR, test_paths)
pure_sources.each do |path|
  next if test_target.source_build_phase.files_references.compact.any? { |reference| reference.real_path.to_s == path }

  test_target.add_file_references([reference_for(project, app_group, APP_SOURCE_DIR, path)])
end

remove_empty_groups(app_group)
project.save

scheme = Xcodeproj::XCScheme.new
scheme.add_build_target(test_target, false)
scheme.add_test_target(test_target)
scheme.save_as(PROJECT_PATH, TEST_TARGET_NAME, true)
