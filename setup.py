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
      version='0.9.12',
      description='OpenSankey',
      url='https://gitlab.com/terriflux-public/OpenSankey',
      author='TerriFlux',
      author_email='contact@terriflux.fr',
      license='MIT',
      packages=['opensankey'],
      package_dir={'opensankey': 'opensankey'},
      package_data={
            'opensankey': [
                  'setup.cfg',
                  'opensankey.ini',
                  'wsgi.py',
                  'server/*.*'
            ]
      },
      cmdclass={
          'sdist': BuildPyCommand,
          'install': InstallPyCommand,
          'egg_info': EggInfoPyCommand,
          'bdist_wheel': BDistWheelInfoPyCommand
      },
        scripts=[
            'opensankey/app.py'
        ],
      zip_safe=False)
