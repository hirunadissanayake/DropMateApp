require 'logger'
require 'cocoapods'
# Now we need to mimic the pod command
require 'cocoapods/command'
Pod::Command.run(ARGV)
