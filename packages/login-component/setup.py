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
        # build_py = self.get_finalized_command('build_py')
        # sankeytools_dir = build_py.get_package_dir('sankeytools')
        # root_dir = os.path.dirname(sankeytools_dir)
        # test_dir = os.path.join(root_dir, 'tests')
        # cp_test_dir = os.path.join(sankeytools_dir, 'tests')
        # if not os.path.exists(cp_test_dir):
        #     shutil.copytree(test_dir, cp_test_dir)
        super(BuildPyCommand, self).run()


class InstallPyCommand(setuptools.command.install.install):
    """Custom build command."""
    def run(self):
        # build_py = self.get_finalized_command('build_py')
        # sankeytools_dir = build_py.get_package_dir('sankeytools')
        # root_dir = os.path.dirname(sankeytools_dir)
        # test_dir = os.path.join(root_dir, 'tests')
        # cp_test_dir = os.path.join(sankeytools_dir, 'tests')
        # if not os.path.exists(cp_test_dir):
        #     shutil.copytree(test_dir, cp_test_dir)
        super(InstallPyCommand, self).run()


class EggInfoPyCommand(setuptools.command.egg_info.egg_info):
    """Custom build command."""
    def run(self):
        # build_py = self.get_finalized_command('build_py')
        # sankeytools_dir = build_py.get_package_dir('sankeytools')
        # root_dir = os.path.dirname(sankeytools_dir)
        # test_dir = os.path.join(root_dir, 'tests')
        # cp_test_dir = os.path.join(sankeytools_dir, 'tests')
        # if not os.path.exists(cp_test_dir):
        #     shutil.copytree(test_dir, cp_test_dir)
        super(EggInfoPyCommand, self).run()


class BDistWheelInfoPyCommand(wheel.bdist_wheel.bdist_wheel):
    """Custom build command."""
    def run(self):
        # build_py = self.get_finalized_command('build_py')
        # sankeytools_dir = build_py.get_package_dir('logincomponent')
        # root_dir = os.path.dirname(sankeytools_dir)
        super(BDistWheelInfoPyCommand, self).run()


setup(name='LoginComponent',
      version='1.0.0',
      description='Login Component',
      url='git@gitlab.com:su-model/su-model-sankey.git',
      author='TerriFlux',
      author_email='julien.alapetite@terriflux.fr',
      license='MIT',
      packages=['logincomponent'],
      package_dir={'logincomponent':'.'},
      package_data={
        'logincomponent': [
                'setup.cfg',
                'server/*.*',
                'server/templates/password_modification_mail/*.*',
                'server/templates/password_reset_mail/*.*',
                'server/templates/register_mail/*.*'
        ]
      },
      cmdclass={
          'sdist': BuildPyCommand,
          'install': InstallPyCommand,
          'egg_info': EggInfoPyCommand,
          'bdist_wheel': BDistWheelInfoPyCommand
      },
      zip_safe=False)
