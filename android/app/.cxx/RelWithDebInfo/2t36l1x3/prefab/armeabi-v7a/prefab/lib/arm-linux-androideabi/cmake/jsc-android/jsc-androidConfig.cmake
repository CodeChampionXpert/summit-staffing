if(NOT TARGET jsc-android::jsc)
add_library(jsc-android::jsc SHARED IMPORTED)
set_target_properties(jsc-android::jsc PROPERTIES
    IMPORTED_LOCATION "C:/Users/DELL/.gradle/caches/8.13/transforms/7e9d27350924808cb62b0c89eeba00fc/transformed/jsc-android-2026004.0.1/prefab/modules/jsc/libs/android.armeabi-v7a/libjsc.so"
    INTERFACE_INCLUDE_DIRECTORIES "C:/Users/DELL/.gradle/caches/8.13/transforms/7e9d27350924808cb62b0c89eeba00fc/transformed/jsc-android-2026004.0.1/prefab/modules/jsc/include"
    INTERFACE_LINK_LIBRARIES ""
)
endif()

