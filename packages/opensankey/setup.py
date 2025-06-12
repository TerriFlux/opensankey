from setuptools import setup
import setuptools.command.sdist
import setuptools.command.install
import setuptools.command.egg_info
import wheel.bdist_wheel

import shutil
import setuptools
import os


def get_long_description():
    try:
        with open('mfa_problem/README.md') as f:
            long_description = f.read()
            return long_description
    except Exception:
        with open('README.md') as f:
            long_description = f.read()
            return long_description


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


setup(
    name='OpenSankey',
    version='1.0.0b3',
    description='OpenSankey',
    url='https://gitlab.com/terriflux-public/OpenSankey',
    author='TerriFlux',
    author_email='contact@terriflux.fr',
    license='MIT',
    packages=[
        'opensankey',
        'opensankey.server'
    ],
    package_dir={'opensankey': 'opensankey'},
    cmdclass={
        'sdist': BuildPyCommand,
        'install': InstallPyCommand,
        'egg_info': EggInfoPyCommand,
        'bdist_wheel': BDistWheelInfoPyCommand
    },
    scripts=[
        'opensankey/app.py'
    ],
    zip_safe=False,
    long_description=get_long_description(),
    long_description_content_type='text/markdown'
)

# git clean -d -x -f
# python setup.py sdist bdist_wheel
# python -m twine upload --repository pypi dist/*
