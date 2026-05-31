require 'xcodeproj'
project_path = 'ios/DropMate.xcodeproj'
project = Xcodeproj::Project.open(project_path)

# Find the main group
main_group = project.main_group['DropMate']

# Files to add
files_to_add = ['GoogleService-Info.plist', 'request_alert.mp3']

# Check targets
target = project.targets.find { |t| t.name == 'DropMate' }

if target
  files_to_add.each do |file_name|
    file_path = "ios/DropMate/#{file_name}"
    
    # Check if already in group
    unless main_group.find_file_by_path(file_name)
      file_ref = main_group.new_file(file_name)
      target.add_resources([file_ref])
      puts "Added #{file_name} to project and target."
    else
      puts "#{file_name} already in project."
    end
  end
  project.save
  puts "Project saved successfully."
else
  puts "Target DropMate not found."
end
