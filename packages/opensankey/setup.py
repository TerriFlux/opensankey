from setuptools import setup
import setuptools.command.sdist
import setuptools.command.install
import setuptools.command.egg_info
import wheel.bdist_wheel

import shutil
import setuptools
import os


class BuildPyCommand(setuptools.command.sdist.sdist):
    """Custom build command."""
    def run(self):
        build_py = self.get_finalized_command('build_py')
        sankeytools_dir = build_py.get_package_dir('opensankey')
        root_dir = os.path.dirname(sankeytools_dir)
        test_dir = os.path.join(root_dir, 'tests')
        cp_test_dir = os.path.join(sankeytools_dir, 'tests')
        if not os.path.exists(cp_test_dir):
            shutil.copytree(test_dir, cp_test_dir)
        super(BuildPyCommand, self).run()


class InstallPyCommand(setuptools.command.install.install):
    """Custom build command."""
    def run(self):
        build_py = self.get_finalized_command('build_py')
        sankeytools_dir = build_py.get_package_dir('opensankey')
        root_dir = os.path.dirname(sankeytools_dir)
        test_dir = os.path.join(root_dir, 'tests')
        cp_test_dir = os.path.join(sankeytools_dir, 'tests')
        if not os.path.exists(cp_test_dir):
            shutil.copytree(test_dir, cp_test_dir)
        super(InstallPyCommand, self).run()


class EggInfoPyCommand(setuptools.command.egg_info.egg_info):
    """Custom build command."""
    def run(self):
        build_py = self.get_finalized_command('build_py')
        sankeytools_dir = build_py.get_package_dir('opensankey')
        root_dir = os.path.dirname(sankeytools_dir)
        test_dir = os.path.join(root_dir, 'tests')
        cp_test_dir = os.path.join(sankeytools_dir, 'tests')
        if not os.path.exists(cp_test_dir):
            shutil.copytree(test_dir, cp_test_dir)
        super(EggInfoPyCommand, self).run()


class BDistWheelInfoPyCommand(wheel.bdist_wheel.bdist_wheel):
    """Custom build command."""
    def run(self):
        build_py = self.get_finalized_command('build_py')
        sankeytools_dir = build_py.get_package_dir('opensankey')
        root_dir = os.path.dirname(sankeytools_dir)
        test_dir = os.path.join(root_dir, 'tests')
        cp_test_dir = os.path.join(sankeytools_dir, 'tests')
        if not os.path.exists(cp_test_dir):
            shutil.copytree(test_dir, cp_test_dir)
        super(BDistWheelInfoPyCommand, self).run()


setup(name='OpenSankey',
      version='0.12.0dev',
      description='Sankey Tools',
      url='git@gitlab.com:su-model/opensankey.git',
      author='Greel',
      author_email='julien.alapetite@gmail.com',
      license='MIT',
      packages=['opensankey', 'opensankey.tests'],
      package_dir={'opensankey': 'opensankey'},
      package_data={
            'opensankey': [
                  'setup.cfg',
                  'opensankey.ini',
                  'wsgi.py',
                  'server/*.*',
                  'doc/*.*',
                  'tests/donnees/*.*',
                  'tests/output_references/*.*',
                  'server/exemples/*.*',
                  'client/build/*.*',
                  'client/build/static/css/*.css',
                  'client/build/static/js/*.js',
                  'client/build/static/media/*.*',
                  'client/src/image'
                  'doc/build/html/_images/*',
                  'doc/build/html/_sources/*',
                  'doc/build/html/_static/*',
                  'doc/build/html/_static/css/*',
                  'doc/build/html/_static/css/fonts/*',
                  'doc/build/html/_static/js/*',
                  'doc/build/html/*'
            ]
      },
      cmdclass={
          'sdist': BuildPyCommand,
          'install': InstallPyCommand,
          'egg_info': EggInfoPyCommand,
          'bdist_wheel': BDistWheelInfoPyCommand
      },
      zip_safe=False)
