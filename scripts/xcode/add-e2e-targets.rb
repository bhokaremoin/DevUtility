# Adds the E2E build configuration and the DevUtilityE2ETests UI test target.
# Run from the repo root: ruby scripts/xcode/add-e2e-targets.rb, then: npm run pods
require 'xcodeproj'

PROJECT_PATH = File.expand_path('../../macos/DevUtility.xcodeproj', __dir__)
APP_TARGET_NAME = 'DevUtility-macOS'
TEST_TARGET_NAME = 'DevUtilityE2ETests'
E2E_CONFIGURATION = 'E2E'
E2E_BUNDLE_ID = 'org.reactjs.native.DevUtility.e2e'

project = Xcodeproj::Project.open(PROJECT_PATH)
app_target = project.targets.find { |target| target.name == APP_TARGET_NAME }

def add_configuration_copied_from_release(configuration_list, project)
  return if configuration_list[E2E_CONFIGURATION]

  release = configuration_list['Release']
  e2e = project.new(Xcodeproj::Project::Object::XCBuildConfiguration)
  e2e.name = E2E_CONFIGURATION
  e2e.build_settings = Marshal.load(Marshal.dump(release.build_settings))
  e2e.base_configuration_reference = release.base_configuration_reference
  configuration_list.build_configurations << e2e
end

# new_target links Cocoa.framework through a path inside one SDK version (e.g. MacOSX15.0.sdk),
# which dangles on any other Xcode. Swift links Cocoa automatically from `import`, so drop it.
def remove_sdk_pinned_cocoa_framework(project, test_target)
  cocoa_build_files = test_target.frameworks_build_phase.files.select { |file| file.display_name == 'Cocoa.framework' }
  cocoa_build_files.each(&:remove_from_project)

  sdk_pinned_cocoa_references = project.files.select do |reference|
    reference.path.to_s.match?(%r{/MacOSX[0-9.]+\.sdk/.*/Cocoa\.framework\z}) && reference.build_files.empty?
  end
  sdk_pinned_cocoa_references.each do |reference|
    parent_group = reference.parent
    reference.remove_from_project
    parent_group.remove_from_project if parent_group.children.empty? && parent_group != project.frameworks_group
  end
end

add_configuration_copied_from_release(project.build_configuration_list, project)
project.targets.each do |target|
  add_configuration_copied_from_release(target.build_configuration_list, project)
end

app_e2e = app_target.build_configuration_list[E2E_CONFIGURATION].build_settings
app_e2e['PRODUCT_BUNDLE_IDENTIFIER'] = E2E_BUNDLE_ID
app_e2e['GCC_PREPROCESSOR_DEFINITIONS'] = ['$(inherited)', 'E2E_BUILD=1']
app_e2e['SWIFT_ACTIVE_COMPILATION_CONDITIONS'] = '$(inherited) E2E_BUILD'

unless project.targets.any? { |target| target.name == TEST_TARGET_NAME }
  test_target = project.new_target(:ui_test_bundle, TEST_TARGET_NAME, :osx, '11.0')
  test_target.add_dependency(app_target)
  add_configuration_copied_from_release(test_target.build_configuration_list, project)
  project.main_group.find_subpath(TEST_TARGET_NAME, true).set_path(TEST_TARGET_NAME)
end

test_target = project.targets.find { |target| target.name == TEST_TARGET_NAME }
remove_sdk_pinned_cocoa_framework(project, test_target)
test_target.build_configurations.each do |configuration|
  settings = configuration.build_settings
  settings['PRODUCT_NAME'] = '$(TARGET_NAME)'
  settings['TEST_TARGET_NAME'] = APP_TARGET_NAME
  settings['GENERATE_INFOPLIST_FILE'] = 'YES'
  settings['PRODUCT_BUNDLE_IDENTIFIER'] = 'org.reactjs.native.DevUtilityE2ETests'
  settings['SWIFT_VERSION'] = '5.0'
  settings['CODE_SIGN_IDENTITY'] = '-'
  settings['CODE_SIGN_STYLE'] = 'Manual'
  settings['MACOSX_DEPLOYMENT_TARGET'] = '14.0'
end
# AppLauncher refuses to launch the app unless the suite was built with E2E_BUILD, so a Debug
# test run can never wipe the data of the production-ID Debug app.
test_target.build_configuration_list[E2E_CONFIGURATION].build_settings['SWIFT_ACTIVE_COMPILATION_CONDITIONS'] =
  '$(inherited) E2E_BUILD'

test_group = project.main_group[TEST_TARGET_NAME]
existing_paths = test_target.source_build_phase.files_references.map(&:real_path).map(&:to_s)
Dir[File.join(File.dirname(PROJECT_PATH), TEST_TARGET_NAME, '**', '*.swift')].sort.each do |path|
  next if existing_paths.include?(path)

  relative_dir = File.dirname(path).sub(File.join(File.dirname(PROJECT_PATH), TEST_TARGET_NAME), '').delete_prefix('/')
  group = relative_dir.empty? ? test_group : test_group.find_subpath(relative_dir, true)
  group.set_path(File.basename(relative_dir)) unless relative_dir.empty? || group.path
  test_target.add_file_references([group.new_reference(File.basename(path))])
end

project.save

scheme_path = File.join(PROJECT_PATH, 'xcshareddata', 'xcschemes', "#{APP_TARGET_NAME}.xcscheme")
scheme = Xcodeproj::XCScheme.new(scheme_path)
unless scheme.test_action.testables.any? { |testable| testable.buildable_references.any? { |ref| ref.target_name == TEST_TARGET_NAME } }
  scheme.test_action.add_testable(Xcodeproj::XCScheme::TestAction::TestableReference.new(test_target))
end
scheme.test_action.build_configuration = E2E_CONFIGURATION
scheme.save!
